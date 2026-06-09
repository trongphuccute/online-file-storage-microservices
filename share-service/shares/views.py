from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from .models import ShareLink
from .serializers import (
    ShareLinkSerializer,
    CreateShareLinkSerializer,
    ShareLinkDetailSerializer,
)


class ShareLinkPagination(PageNumberPagination):
    """Phân trang cho danh sách chia sẻ"""
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health(request):
    """Kiểm tra sức khỏe dịch vụ"""
    return Response({
        "service": "share-service",
        "status": "ok",
        "version": "1.1"
    })


@api_view(["POST"])
def create_share_link(request):
    """Tạo link chia sẻ mới"""
    serializer = CreateShareLinkSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            {
                "status": "error",
                "message": "Dữ liệu không hợp lệ",
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        share = serializer.save(owner_id=request.user.id)
        return Response(
            {
                "status": "success",
                "message": "Tạo link chia sẻ thành công",
                "data": ShareLinkSerializer(share).data
            },
            status=status.HTTP_201_CREATED
        )
    except Exception as e:
        return Response(
            {
                "status": "error",
                "message": f"Lỗi tạo link chia sẻ: {str(e)}"
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
def my_share_links(request):
    """Lấy danh sách link chia sẻ của người dùng hiện tại"""
    try:
        # Lọc theo các tham số
        queryset = ShareLink.objects.filter(owner_id=request.user.id)
        
        # Lọc theo file_id
        file_id = request.query_params.get("file_id")
        if file_id:
            try:
                queryset = queryset.filter(file_id=int(file_id))
            except ValueError:
                return Response(
                    {
                        "status": "error",
                        "message": "file_id phải là một số"
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Lọc theo trạng thái hoạt động
        is_active = request.query_params.get("is_active")
        if is_active is not None:
            is_active_bool = is_active.lower() in ["true", "1", "yes"]
            queryset = queryset.filter(is_active=is_active_bool)
        
        # Lọc theo trạng thái hết hạn
        show_expired = request.query_params.get("show_expired", "false")
        if show_expired.lower() != "true":
            queryset = queryset.filter(expires_at__isnull=True) | queryset.filter(expires_at__gt=timezone.now())
        
        # Sắp xếp
        sort_by = request.query_params.get("sort_by", "-created_at")
        if sort_by in ["-created_at", "created_at", "-access_count", "access_count"]:
            queryset = queryset.order_by(sort_by)
        
        # Phân trang
        paginator = ShareLinkPagination()
        paginated_queryset = paginator.paginate_queryset(queryset, request)
        
        serializer = ShareLinkSerializer(paginated_queryset, many=True)
        return paginator.get_paginated_response({
            "status": "success",
            "data": serializer.data
        })
        
    except Exception as e:
        return Response(
            {
                "status": "error",
                "message": f"Lỗi lấy danh sách: {str(e)}"
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET", "PATCH", "DELETE"])
def manage_share_link(request, token):
    """Quản lý link chia sẻ (xem, cập nhật, xóa)"""
    try:
        share = ShareLink.objects.get(token=token)
        
        # Kiểm tra quyền sở hữu
        if share.owner_id != request.user.id:
            return Response(
                {
                    "status": "error",
                    "message": "Bạn không có quyền truy cập link này"
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        if request.method == "GET":
            return Response({
                "status": "success",
                "data": ShareLinkSerializer(share).data
            })
        
        elif request.method == "PATCH":
            serializer = CreateShareLinkSerializer(
                share,
                data=request.data,
                partial=True
            )
            if not serializer.is_valid():
                return Response(
                    {
                        "status": "error",
                        "message": "Dữ liệu không hợp lệ",
                        "errors": serializer.errors
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            updated_share = serializer.save()
            return Response({
                "status": "success",
                "message": "Cập nhật thành công",
                "data": ShareLinkSerializer(updated_share).data
            })
        
        elif request.method == "DELETE":
            share.delete()
            return Response({
                "status": "success",
                "message": "Xóa link chia sẻ thành công"
            }, status=status.HTTP_204_NO_CONTENT)
    
    except ShareLink.DoesNotExist:
        return Response(
            {
                "status": "error",
                "message": "Link chia sẻ không tồn tại"
            },
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {
                "status": "error",
                "message": f"Lỗi: {str(e)}"
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def public_share(request, token):
    """Truy cập link chia sẻ công khai"""
    try:
        share = ShareLink.objects.get(token=token)
        
        # Kiểm tra có thể truy cập không
        can_access, message = share.can_access()
        
        if not can_access:
            if share.is_expired():
                return Response(
                    {
                        "status": "error",
                        "message": message,
                        "code": "LINK_EXPIRED"
                    },
                    status=status.HTTP_410_GONE
                )
            else:
                return Response(
                    {
                        "status": "error",
                        "message": message,
                        "code": "LINK_INACTIVE"
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Tăng bộ đếm truy cập
        share.increment_access_count()
        
        return Response({
            "status": "success",
            "data": ShareLinkDetailSerializer(share).data
        })
    
    except ShareLink.DoesNotExist:
        return Response(
            {
                "status": "error",
                "message": "Link chia sẻ không tồn tại",
                "code": "NOT_FOUND"
            },
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {
                "status": "error",
                "message": f"Lỗi: {str(e)}"
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
