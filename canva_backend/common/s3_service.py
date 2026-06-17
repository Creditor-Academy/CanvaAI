import boto3
import uuid
import mimetypes
from django.conf import settings
from botocore.exceptions import NoCredentialsError, ClientError

def get_s3_client():
    return boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    )

def upload_file_to_s3(file_obj, folder='avatars'):
    """
    Upload a file object to AWS S3 and return the public URL.
    """
    if not settings.AWS_S3_BUCKET:
        raise ValueError("AWS_S3_BUCKET is not configured.")

    s3_client = get_s3_client()
    
    # Generate a unique filename
    ext = file_obj.name.split('.')[-1] if '.' in file_obj.name else 'jpg'
    unique_filename = f"{folder}/{uuid.uuid4().hex}.{ext}"
    
    # Determine content type
    content_type, _ = mimetypes.guess_type(file_obj.name)
    if not content_type:
        content_type = 'application/octet-stream'

    try:
        s3_client.upload_fileobj(
            file_obj,
            settings.AWS_S3_BUCKET,
            unique_filename,
            ExtraArgs={
                'ContentType': content_type,
                # Comment out ACL='public-read' if the bucket doesn't support ACLs
                # and relies on a public bucket policy.
                # 'ACL': 'public-read'
            }
        )
        
        # Generate the public URL
        url = f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{unique_filename}"
        return url
        
    except (NoCredentialsError, ClientError) as e:
        print(f"S3 Upload Error: {str(e)}")
        raise Exception(f"Failed to upload file to S3: {str(e)}")
