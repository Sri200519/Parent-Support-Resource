# Autism Support Resource App

This app is designed to provide accessible resources and support related to autism. It features a simple, user-friendly interface that allows individuals with autism, their families, and caregivers to easily find valuable information such as local events, food banks, and autism-related services.

## Features

- **Comprehensive Resource Database**: A searchable and well-organized database of autism-related services, support groups, medical services, educational programs, and local events.
- **Speech Recognition**: Voice input functionality that listens for user queries and automatically sends messages once a pause in speech is detected, enhancing accessibility for users who prefer to interact using voice.
- **Geolocation & Leaflet Map**: Users can enter an address to get location-based resource recommendations, and a map powered by Leaflet helps visualize nearby services.
- **Google Cloud Storage**: The app stores and manages its resources and data in Google Cloud Storage buckets for easy access and scalability.
- **Tailwind CSS**: Tailwind CSS is used to create a responsive, accessible, and clean UI, ensuring the app is easy to navigate on both desktop and mobile devices.

## Technologies Used

- **Frontend**: Tailwind CSS, HTML, JavaScript
- **Backend**: Flask (Python)
- **Maps**: Leaflet.js for interactive maps
- **Storage**: Google Cloud Storage (GCP Buckets)
- **Speech Recognition**: Web Speech API (for voice input)
- **Geolocation**: Google Maps API (for address resolution)

## Setup

### Prerequisites

- Python 3.7 or higher
- Node.js (v14 or higher) for frontend setup
- Google Cloud account with API access (for Google Maps and Cloud Storage)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/autism-support-resource-app.git
   ```

2. Navigate to the project directory:

   ```bash
   cd autism-support-resource-app
   ```

3. Set up a virtual environment and activate it:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows, use venv\Scripts\activate
   ```

4. Install backend dependencies:

   ```bash
   pip install -r requirements.txt
   ```

5. Install frontend dependencies (for Tailwind CSS and any JavaScript libraries):

   ```bash
   npm install
   ```

6. Set up environment variables for Google Cloud Storage and Google Maps API access in a `.env` file.

7. Run the Flask app:

   ```bash
   flask run
   ```

8. Access the app in your browser at `http://localhost:5000`.

## Usage

- **Search for Resources**: Use the search bar to find autism-related resources, support groups, and services.
- **Voice Interaction**: Click the microphone icon to start voice input. Speak your query, and the app will automatically send the message once a pause is detected.
- **Geolocation**: Enter an address to receive location-based recommendations. The Leaflet map will display nearby services and events based on the entered location.
  
## License

This project is licensed under the CC License - see the [LICENSE](LICENSE) file for details.

## Contributing

We welcome contributions to improve the Autism Support Resource app! If you'd like to contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix (`git checkout -b feature-branch`).
3. Make your changes and commit them (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature-branch`).
5. Create a pull request.


## Roadmap

### Future Enhancements

- **Multilingual Support**: Adding multi-language support for broader accessibility.
- **Mobile App Version**: Creating a mobile-friendly version of the app for iOS and Android.
- **Resource Filtering**: Allow users to filter resources based on needs, such as age group or type of service.
- **User Contributions**: Let users add and share local resources and events to foster community-driven content.

## Support

For questions or support, please reach out via GitHub Issues or email us at [skopparapu19@gmail.com](mailto:skopparapu19@gmail.com).

## Acknowledgments

- **Speech Recognition**: This feature uses the Web Speech API for real-time speech-to-text conversion.
- **Google Maps API**: Geolocation services are powered by the Google Maps API, allowing accurate address resolution.
- **Leaflet**: Interactive maps are powered by Leaflet.js, a lightweight, open-source JavaScript library for maps.
