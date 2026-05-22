from django.conf import settings


def upload_blob(blob_name: str, file_obj) -> None:
    if not settings.AZURE_STORAGE_CONNECTION_STRING:
        return

    from azure.storage.blob import BlobServiceClient

    client = BlobServiceClient.from_connection_string(
        settings.AZURE_STORAGE_CONNECTION_STRING
    )
    container = client.get_container_client(settings.AZURE_STORAGE_CONTAINER)
    try:
        container.create_container()
    except Exception:
        pass
    container.upload_blob(name=blob_name, data=file_obj, overwrite=True)


def delete_blob(blob_name: str) -> None:
    if not settings.AZURE_STORAGE_CONNECTION_STRING:
        return

    from azure.storage.blob import BlobServiceClient

    client = BlobServiceClient.from_connection_string(
        settings.AZURE_STORAGE_CONNECTION_STRING
    )
    blob = client.get_blob_client(settings.AZURE_STORAGE_CONTAINER, blob_name)
    blob.delete_blob()
