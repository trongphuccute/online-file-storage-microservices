"""
Blob storage helpers — dual mode: Azure Blob Storage or local filesystem.
All download functions return a file-like stream (never bytes) so callers
can use Django's FileResponse for chunked streaming.
"""
from __future__ import annotations

from django.conf import settings
from django.core.files.storage import default_storage


def _local_path(blob_name: str) -> str:
    return f"uploads/{blob_name}"


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

def upload_blob(blob_name: str, file_obj) -> None:
    """Upload a file-like object to storage."""
    if not settings.AZURE_STORAGE_CONNECTION_STRING:
        file_obj.seek(0)
        default_storage.save(_local_path(blob_name), file_obj)
        return

    from azure.storage.blob import BlobServiceClient

    file_obj.seek(0)
    client = BlobServiceClient.from_connection_string(
        settings.AZURE_STORAGE_CONNECTION_STRING
    )
    container = client.get_container_client(settings.AZURE_STORAGE_CONTAINER)
    try:
        container.create_container()
    except Exception:
        pass
    container.upload_blob(name=blob_name, data=file_obj, overwrite=True)


# ---------------------------------------------------------------------------
# Download — always returns a readable stream
# ---------------------------------------------------------------------------

def open_blob(blob_name: str):
    """
    Return a readable binary stream for the blob.
    - Local: returns an open file handle (FileResponse-compatible).
    - Azure: returns the StorageStreamDownloader object whose .chunks()
      iterator yields bytes without loading the whole file into RAM.
    """
    if not settings.AZURE_STORAGE_CONNECTION_STRING:
        return default_storage.open(_local_path(blob_name), "rb")

    from azure.storage.blob import BlobServiceClient

    client = BlobServiceClient.from_connection_string(
        settings.AZURE_STORAGE_CONNECTION_STRING
    )
    blob_client = client.get_blob_client(
        settings.AZURE_STORAGE_CONTAINER, blob_name
    )
    # download_blob() returns a StorageStreamDownloader — NOT bytes.
    # Calling .readall() here would load everything into RAM; instead we
    # return the downloader so the view can iterate its .chunks().
    return blob_client.download_blob()


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

def delete_blob(blob_name: str) -> None:
    if not settings.AZURE_STORAGE_CONNECTION_STRING:
        path = _local_path(blob_name)
        if default_storage.exists(path):
            default_storage.delete(path)
        return

    from azure.storage.blob import BlobServiceClient

    client = BlobServiceClient.from_connection_string(
        settings.AZURE_STORAGE_CONNECTION_STRING
    )
    blob_client = client.get_blob_client(
        settings.AZURE_STORAGE_CONTAINER, blob_name
    )
    try:
        blob_client.delete_blob()
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Streaming helper for views
# ---------------------------------------------------------------------------

CHUNK_SIZE = 8192  # 8 KB


def iter_blob(blob_name: str):
    """
    Generator that yields chunks of the blob's content.
    Works for both Azure and local storage — safe for StreamingHttpResponse.
    """
    stream = open_blob(blob_name)

    if settings.AZURE_STORAGE_CONNECTION_STRING:
        # StorageStreamDownloader supports .chunks(max_chunk_get_size)
        yield from stream.chunks(max_chunk_get_size=CHUNK_SIZE)
    else:
        # Local file handle
        try:
            while True:
                chunk = stream.read(CHUNK_SIZE)
                if not chunk:
                    break
                yield chunk
        finally:
            stream.close()
