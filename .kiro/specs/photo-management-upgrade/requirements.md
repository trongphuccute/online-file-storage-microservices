# Requirements Document

## Introduction

Nâng cấp file-service hiện tại thành hệ thống quản lý ảnh chuyên dụng (Photo Management System) tích hợp trên kiến trúc microservices với Next.js frontend và Django backend. Hệ thống hiện có hỗ trợ upload/download/delete/list file cùng quota management; bản nâng cấp bổ sung: tổ chức ảnh theo album, tự động sinh thumbnail, chia sẻ ảnh qua link, tìm kiếm/filter/phân trang, đổi tên ảnh, validate định dạng ảnh, streaming download, và tối ưu quota calculation.

---

## Glossary

- **Photo_Service**: Django REST Framework backend xử lý toàn bộ nghiệp vụ quản lý ảnh (kế thừa từ file-service).
- **Album**: Nhóm logic chứa các ảnh của một người dùng, có tên và mô tả tùy chọn.
- **Photo**: File ảnh hợp lệ (JPEG, PNG, GIF, WEBP, BMP, TIFF, SVG) được lưu trữ trong hệ thống.
- **Thumbnail**: Ảnh thu nhỏ (≤ 400×400 px) được sinh tự động khi upload, lưu cùng blob storage.
- **Share_Link**: Token duy nhất cho phép truy cập ảnh công khai (không cần JWT) trong thời hạn xác định.
- **Quota_Cache**: Giá trị tổng dung lượng đã dùng được cache trong bảng `UserQuota` để tránh tính toán lại toàn bộ.
- **Owner**: Người dùng xác thực qua JWT, được nhận diện bằng `user.id` từ token.
- **Blob_Storage**: Azure Blob Storage hoặc local filesystem (fallback) nơi lưu trữ file ảnh và thumbnail.
- **Paginator**: Thành phần trả về kết quả danh sách ảnh theo trang với `page` và `page_size`.
- **Stream_Response**: HTTP response trả dữ liệu nhị phân theo từng chunk thay vì load toàn bộ vào RAM.

---

## Requirements

### Requirement 1: Validate định dạng file ảnh khi upload

**User Story:** As a user, I want the system to only accept image files, so that non-image files cannot be stored in the photo management system.

#### Acceptance Criteria

1. WHEN a file is uploaded, THE Photo_Service SHALL reject files whose MIME type is not in the allowed set {image/jpeg, image/png, image/gif, image/webp, image/bmp, image/tiff, image/svg+xml} with HTTP 400 and a descriptive error message.
2. WHEN a file is uploaded, THE Photo_Service SHALL reject files whose filename extension does not match one of {.jpg, .jpeg, .png, .gif, .webp, .bmp, .tiff, .tif, .svg} with HTTP 400 and a descriptive error message.
3. WHEN a valid image file is uploaded, THE Photo_Service SHALL accept the file and proceed with the upload workflow.
4. IF the uploaded file's MIME type and extension are mismatched, THEN THE Photo_Service SHALL reject the file with HTTP 400 and a descriptive error message.

---

### Requirement 2: Tự động sinh thumbnail khi upload ảnh

**User Story:** As a user, I want thumbnails to be automatically generated when I upload a photo, so that the frontend can display previews without loading full-size images.

#### Acceptance Criteria

1. WHEN a valid image file is uploaded successfully, THE Photo_Service SHALL generate a thumbnail with the longest edge not exceeding 400 pixels while preserving the original aspect ratio.
2. WHEN a thumbnail is generated, THE Photo_Service SHALL store the thumbnail in Blob_Storage under a blob name derived from the original blob name with a `_thumb` suffix before the file extension.
3. WHEN a thumbnail is generated, THE Photo_Service SHALL record the thumbnail's blob name in the corresponding Photo metadata record.
4. IF thumbnail generation fails due to a corrupted or unsupported image format, THEN THE Photo_Service SHALL complete the upload successfully and set the thumbnail blob name to null in the metadata record.
5. WHEN a photo is deleted, THE Photo_Service SHALL delete the corresponding thumbnail from Blob_Storage if a thumbnail blob name exists.
6. WHEN the thumbnail endpoint for a photo is requested, THE Photo_Service SHALL return the thumbnail image with the appropriate MIME type.

---

### Requirement 3: Quản lý Album

**User Story:** As a user, I want to organize my photos into albums, so that I can group related photos together.

#### Acceptance Criteria

1. WHEN a user sends a create-album request with a name (1–100 characters), THE Photo_Service SHALL create a new Album record owned by that user and return HTTP 201 with the album data.
2. WHEN a user sends a list-albums request, THE Photo_Service SHALL return all albums owned by that user ordered by creation date descending.
3. WHEN a user sends an update-album request for an album they own, THE Photo_Service SHALL update the album's name and/or description and return HTTP 200.
4. WHEN a user sends a delete-album request for an album they own, THE Photo_Service SHALL delete the album record and disassociate all photos from that album (set album to null) without deleting the photos.
5. IF a user sends a create-album request with a name exceeding 100 characters, THEN THE Photo_Service SHALL return HTTP 400 with a descriptive error message.
6. IF a user attempts to access, update, or delete an album they do not own, THEN THE Photo_Service SHALL return HTTP 404.
7. WHEN a user uploads a photo with a valid album_id parameter, THE Photo_Service SHALL associate the uploaded photo with the specified album.
8. WHEN a user sends a request to move a photo to an album, THE Photo_Service SHALL update the photo's album association and return HTTP 200.

---

### Requirement 4: Tìm kiếm, Filter và Phân trang danh sách ảnh

**User Story:** As a user, I want to search and filter my photos and navigate results by page, so that I can find specific photos efficiently in a large collection.

#### Acceptance Criteria

1. WHEN a list-photos request includes a `search` query parameter, THE Photo_Service SHALL return only photos owned by the user whose `original_name` contains the search string (case-insensitive).
2. WHEN a list-photos request includes a `album_id` query parameter, THE Photo_Service SHALL return only photos owned by the user that belong to the specified album.
3. WHEN a list-photos request includes `date_from` and/or `date_to` query parameters in ISO 8601 format, THE Photo_Service SHALL return only photos whose `created_at` falls within the specified date range.
4. THE Photo_Service SHALL paginate the list-photos response using `page` (default: 1) and `page_size` (default: 20, maximum: 100) query parameters.
5. WHEN a list-photos request is processed, THE Photo_Service SHALL return a response containing `count` (total matching photos), `next` (URL of next page or null), `previous` (URL of previous page or null), and `results` (array of photo objects for the current page).
6. IF a `page_size` value greater than 100 is provided, THEN THE Photo_Service SHALL use 100 as the effective page size.
7. WHEN multiple filter parameters are provided simultaneously, THE Photo_Service SHALL apply all filters with logical AND combination.

---

### Requirement 5: Đổi tên ảnh

**User Story:** As a user, I want to rename my photos, so that I can give them meaningful names after uploading.

#### Acceptance Criteria

1. WHEN a user sends a rename request for a photo they own with a new name (1–255 characters), THE Photo_Service SHALL update `original_name` on the photo record and return HTTP 200 with the updated photo data.
2. IF a user sends a rename request for a photo they do not own, THEN THE Photo_Service SHALL return HTTP 404.
3. IF a user sends a rename request with a name exceeding 255 characters, THEN THE Photo_Service SHALL return HTTP 400 with a descriptive error message.
4. IF a user sends a rename request with an empty name, THEN THE Photo_Service SHALL return HTTP 400 with a descriptive error message.
5. WHEN a photo is renamed, THE Photo_Service SHALL preserve the original file extension in the stored `original_name`.

---

### Requirement 6: Chia sẻ ảnh qua Share Link

**User Story:** As a user, I want to generate a shareable link for a photo, so that others can view the photo without needing an account.

#### Acceptance Criteria

1. WHEN a user sends a create-share-link request for a photo they own, THE Photo_Service SHALL create a Share_Link record with a cryptographically random token (minimum 32 bytes of entropy) and return HTTP 201 with the share URL.
2. WHERE an expiry duration is specified, THE Photo_Service SHALL set `expires_at` on the Share_Link record to the current UTC time plus the specified duration in seconds.
3. WHEN a public access request is made with a valid token, THE Photo_Service SHALL return the photo data without requiring JWT authentication.
4. IF a public access request is made with a token whose `expires_at` has passed, THEN THE Photo_Service SHALL return HTTP 410 (Gone) with a descriptive error message.
5. IF a public access request is made with a token that does not exist, THEN THE Photo_Service SHALL return HTTP 404.
6. WHEN a user sends a revoke-share-link request for a Share_Link they own, THE Photo_Service SHALL delete the Share_Link record and return HTTP 204.
7. WHEN a user sends a list-share-links request, THE Photo_Service SHALL return all active Share_Links owned by that user.
8. IF a public access request is made for a share link whose associated photo has been deleted, THEN THE Photo_Service SHALL return HTTP 404.

---

### Requirement 7: Streaming Download

**User Story:** As a user, I want photo downloads to be streamed in chunks, so that the server does not load entire files into RAM and large photos download efficiently.

#### Acceptance Criteria

1. WHEN a download request is made for a photo, THE Photo_Service SHALL return the photo data as a Stream_Response using chunked transfer encoding with a chunk size of 8192 bytes.
2. WHEN a streaming download is in progress, THE Photo_Service SHALL NOT load the entire file content into server RAM before sending the first byte.
3. WHEN a download request is made for a photo stored in Azure Blob Storage, THE Photo_Service SHALL use the Azure SDK's streaming download API to obtain a readable stream.
4. WHEN a download request is made for a photo stored in local storage, THE Photo_Service SHALL open the file and stream it using Django's FileResponse.
5. IF a download request is made for a photo the requesting user does not own (and no valid Share_Link token is provided), THEN THE Photo_Service SHALL return HTTP 403.

---

### Requirement 8: Tối ưu Quota Calculation

**User Story:** As a developer, I want quota calculations to use cached values instead of full table scans, so that quota checks during uploads remain fast as the number of photos grows.

#### Acceptance Criteria

1. THE Photo_Service SHALL maintain a `used_bytes` field in the `UserQuota` record that reflects the current total size of all photos owned by the user.
2. WHEN a photo is successfully uploaded, THE Photo_Service SHALL increment `used_bytes` in the corresponding `UserQuota` record by the photo's size in bytes using a database-level atomic update.
3. WHEN a photo is deleted, THE Photo_Service SHALL decrement `used_bytes` in the corresponding `UserQuota` record by the deleted photo's size in bytes using a database-level atomic update.
4. WHEN the quota endpoint is called, THE Photo_Service SHALL return `used_bytes` from the `UserQuota` record without performing a SUM aggregation over the `StoredFile` table.
5. IF the `UserQuota` record for a user does not exist when a quota check is performed, THEN THE Photo_Service SHALL create the record with `used_bytes` set to 0 and `limit_bytes` set to the configured default quota.
6. WHEN a quota recalculation is triggered (e.g., via an admin command), THE Photo_Service SHALL recompute `used_bytes` by performing a SUM aggregation over the `StoredFile` table and persist the result to the `UserQuota` record.

---

### Requirement 9: Thumbnail Endpoint

**User Story:** As a frontend developer, I want a dedicated endpoint to retrieve photo thumbnails, so that the UI can efficiently display photo grids without downloading full-resolution images.

#### Acceptance Criteria

1. WHEN a thumbnail request is made for a photo the requesting user owns, THE Photo_Service SHALL return the thumbnail image as a Stream_Response with the correct MIME type.
2. IF the thumbnail blob name for the requested photo is null, THEN THE Photo_Service SHALL return HTTP 404.
3. IF a thumbnail request is made for a photo the requesting user does not own, THEN THE Photo_Service SHALL return HTTP 403.
4. WHERE a valid Share_Link token is provided, THE Photo_Service SHALL allow public access to the thumbnail without JWT authentication.
