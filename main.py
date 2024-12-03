from flask import Flask, request, jsonify
from openai import OpenAI
from flask_cors import CORS
from google.cloud import storage
import googlemaps
import os
import json
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
import re
from geocoding_manager import geocode_address

app = Flask(__name__)
CORS(app)


client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
storage_client = storage.Client()
bucket_name = 'beacon-database'
bucket = storage_client.get_bucket(bucket_name)

# Retrieves either a summary or full data from storage based on a query
def get_summary_or_full_data(query):
    txt_files = [blob for blob in bucket.list_blobs(prefix="Txt files/") if blob.name.endswith('.txt')]
    
    relevant_summary = None
    for blob in txt_files:
        if "food bank" in blob.name.lower() or query.lower() in blob.name.lower():
            relevant_summary = blob.download_as_text()
            break

    if relevant_summary:
        return relevant_summary
    else:
        json_files = [blob for blob in bucket.list_blobs() if blob.name.endswith('.json')]
        for blob in json_files:
            data = json.loads(blob.download_as_text())
            if "food bank" in json.dumps(data).lower() or query.lower() in json.dumps(data).lower():
                return json.dumps(data, indent=2)

    return "No relevant food bank data found."

# Formats food bank location data to a readable string with symbols for display
def format_food_bank_response(raw_response):
    locations = raw_response.split('🏢')
    formatted_locations = []

    for loc in locations:
        if loc.strip():  
            loc = loc.strip()

            parts = loc.split('📍')
            if len(parts) > 1:
                name = parts[0].strip()
                remaining = parts[1]

                address_hours = remaining.split('⏰')
                if len(address_hours) > 1:
                    address = address_hours[0].replace('Address:', '').strip()
                    hours = address_hours[1].replace('Hours:', '').strip()

                    formatted_location = (
                        f"🏢 {name}\n"
                        f"📍 Address: {address}\n"
                        f"⏰ Hours: {hours}\n"
                    )
                    formatted_locations.append(formatted_location)

    return "\n\n".join(formatted_locations)

# Communicates with Chat-GPT to generate responses
def chat_with_gpt(user_input):
    data = get_summary_or_full_data(user_input)
    combined_context = data[:4096]
    
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": """You are an assistant with access to specific user data. 
             When listing locations like food banks, format your response as follows:
             
             🏢 [LOCATION NAME]
             📍 Address: [address]
             ⏰ Hours: [time]
             
             Use two line breaks between each location."""},
            {"role": "user", "content": user_input},
            {"role": "system", "content": f"Here's some context: {combined_context}"}
        ]
    )
    
    raw_response = response.choices[0].message.content
    
    if "food bank" in user_input.lower():
        try:
            return format_food_bank_response(raw_response)
        except Exception as e:
            print(f"Error formatting response: {e}")
            return raw_response
    
    return raw_response


gmaps = googlemaps.Client(key=os.environ.get('GOOGLE_MAPS_API_KEY'))

# Extracts location data from an event dictionary
def parse_location_data(event: Dict[str, Any]) -> Dict[str, Any]:
    if not event:
        return {}

    name = event.get('summary', '').strip()

    address = event.get('location', '').strip()

    time = ''
    description = event.get('description', '')
    if description:
        soup = BeautifulSoup(description, 'html.parser')
        time_pattern = re.compile(r'\d{1,2}:\d{2}[AP]M-\d{1,2}:\d{2}[AP]M')
        for b_tag in soup.find_all('b'):
            time_match = time_pattern.search(b_tag.text)
            if time_match:
                time = time_match.group(0)
                break

    if description:
        soup = BeautifulSoup(description, 'html.parser')
        clean_text = soup.get_text(' ', strip=True)

        county_pattern = re.compile(r'([A-Z]+\s+COUNTY)')
        county_match = county_pattern.search(clean_text)
        county = county_match.group(1) if county_match else ''

        schedule_pattern = re.compile(r'Every \d+ weeks? on ([A-Za-z]+)')
        schedule_match = schedule_pattern.search(clean_text)
        schedule = schedule_match.group(0) if schedule_match else ''

        clean_description = clean_text
        if time:
            clean_description = clean_description.replace(time, '').strip()
        if schedule:
            clean_description = clean_description.replace(schedule, '').strip()
        if county:
            clean_description = clean_description.replace(county, '').strip()

        clean_description = re.sub(r'\s*,\s*', ', ', clean_description)
        clean_description = re.sub(r'\s+', ' ', clean_description)
        clean_description = clean_description.strip(' ,')
    else:
        clean_description = ''
        county = ''
        schedule = ''

    coordinates = {}
    if 'lat' in event and 'lng' in event:
        coordinates = {
            'lat': float(event['lat']),
            'lng': float(event['lng'])
        }
    
    return {
        'id': event.get('id'),
        'name': name,
        'address': address,
        'time': time,
        'county': county,
        'description': clean_description,
        'schedule': schedule,
        'lat': coordinates.get('lat'),
        'lng': coordinates.get('lng')
    }

# Fetches resources from the Google Cloud Storage bucket and processes location data
def fetch_resources() -> List[Dict[str, Any]]:
    try:
        blob = bucket.blob('calendar_events.json')
        json_data = blob.download_as_text()
        resources = json.loads(json_data)

        if not isinstance(resources, list):
            resources = [resources]

        processed_resources = []
        for resource in resources:
            if not isinstance(resource, dict):
                continue
            location_info = parse_location_data(resource)

            if location_info.get('address'):
                coordinates = geocode_address(location_info['address'])
                if coordinates:
                    location_info['lat'] = coordinates['lat']
                    location_info['lng'] = coordinates['lng']
                else:
                    print(f"Could not geocode address: {location_info['address']}")
                    continue
                
                processed_resources.append(location_info)
            else:
                print(f"No valid address found for resource {location_info.get('id')}")
                
        return processed_resources
    except Exception as e:
        print(f"Error fetching resources: {str(e)}")
        return []

@app.route('/api/resources')
def get_resources():
    resources = fetch_resources()
    if resources:
        return jsonify({
            'status': 'success',
            'data': resources
        })
    return jsonify({
        'status': 'error',
        'message': 'Failed to load resources'
    }), 500

@app.route('/chat', methods=['POST'])
def chat():
    user_query = request.json.get('query')
    if not user_query:
        return jsonify({"error": "No query provided"}), 400

    response = chat_with_gpt(user_query)
    return jsonify({"response": response})

if __name__ == '__main__':
    app.run(debug=True)