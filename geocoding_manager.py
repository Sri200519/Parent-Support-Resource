import os
import json
from typing import Optional, Dict
from google.cloud import storage

GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY')
BUCKET_NAME = 'beacon-database'

storage_client = storage.Client()
bucket = storage_client.get_bucket(BUCKET_NAME)

def geocode_address(address: str) -> Optional[Dict[str, float]]:
    try:
        
        blob_name = f"geocoding/{address}.json"
        
        # Check if the blob exists in the storage bucket
        if storage.Blob(bucket=bucket, name=blob_name).exists(storage_client):
            blob = bucket.blob(blob_name)
            coordinates = json.loads(blob.download_as_text())
            return coordinates

        # Geocode the address if it's not stored
        if 'CT' not in address and 'Connecticut' not in address:
            address = f"{address}, Connecticut"

        from googlemaps import Client
        gmaps = Client(key=GOOGLE_MAPS_API_KEY)
        result = gmaps.geocode(address)

        if result and len(result) > 0:
            location = result[0]['geometry']['location']
            coordinates = {
                'lat': location['lat'],
                'lng': location['lng']
            }

            # Stores the coordinates in Google Cloud Storage with the address as the filename
            blob = bucket.blob(blob_name)
            blob.upload_from_string(json.dumps(coordinates))
            print (coordinates)
            return coordinates

    except Exception as e:
        print(f"Geocoding error for {address}: {str(e)}")

    return None
