import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, MessageSquare, FileText, Menu, X, Map} from 'lucide-react';
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import Message from './message';
import AutismResourceMap from './map'


// Main component for the Autism Support App
export default function AutismSupportApp() {
  // State to manage the current page in the app
  const [currentPage, setCurrentPage] = useState('chatbot');
  // State for storing messages in the chat window
  const [messages, setMessages] = useState([
    { text: "Hello! I'm here to provide information about autism support services for children in Connecticut. How can I help you today?", isBot: true },
  ]);
  // State for handling the input message text
  const [inputMessage, setInputMessage] = useState('');
  // Reference to the end of the messages for smooth scrolling
  const messagesEndRef = useRef(null);
  // State for controlling speech recognition listening status
  const [isListening, setIsListening] = useState(false);
  // State to handle the visibility of the navigation bar
  const [isNavOpen, setIsNavOpen] = useState(true);
  
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition({ commands: [
    {
      command: 'reset',
      callback: () => resetTranscript()
    }
  ] });

  // Common queries for quick user access
  const [commonQueries] = useState([
    { title: "Food Banks", query: "Are there any food banks in Connecticut that are open in the next week?" },
    { title: "Autism Basics", query: "Can you provide some basic information about autism spectrum disorder?" },
    { title: "Support Groups", query: "What support groups are available for parents of autistic children in Connecticut?" },
    { title: "Educational Resources", query: "What educational resources are available for autistic children in Connecticut?" },
  ]);

  // Update input field when transcript is updated
  useEffect(() => {
    if (transcript) {
      setInputMessage(transcript);
    }
  }, [transcript]);

  // Scrolls the messages container to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Trigger scroll to bottom when messages are updated
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending a message by updating the message state
  const handleSendMessage = async (messageText) => {
    if (messageText.trim() === '') return;

    setMessages(prev => [...prev, { text: messageText, isBot: false }]);
    setInputMessage('');
    resetTranscript();

    try {
      // Send message to backend and retrieve response
      const response = await fetch('http://127.0.0.1:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: messageText }),
      });

      const data = await response.json();
      const botMessage = data.response;

      // Add bot response to the chat
      setMessages(prev => [...prev, { text: botMessage, isBot: true }]);
    } catch (error) {
      console.error('Error communicating with the backend:', error);
      setMessages(prev => [
        ...prev,
        { text: "Sorry, I couldn't reach the server. Please try again later.", isBot: true },
      ]);
    }
  };

  // Toggle listening for speech recognition
  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      setIsListening(false);
    } else {
      SpeechRecognition.startListening({ continuous: true });
      setIsListening(true);
    }
  };

  // Stop listening and reset the listening state
  const offListening = () => {
    SpeechRecognition.stopListening();
    setIsListening(false);
  };
  
  // Handle form submission for sending a message 
  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };
  // Automatically stop listening after a pause in speech
  useEffect(() => {
    const pauseTimeout = setTimeout(() => {
      if (listening && transcript) {
        SpeechRecognition.stopListening();
        setIsListening(false);
        handleSendMessage(transcript);
        resetTranscript();
      }
    }, 1500); // Most optimal time for pause
    
    return () => clearTimeout(pauseTimeout);
  }, [transcript, listening]);

  // Render chatbot interface
  const renderChatbot = () => (
    <>
      <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-6 mb-4 w-full">
        <h2 className="text-xl font-semibold mb-2 text-purple-800">Welcome to our Autism Support Chatbot</h2>
        <p className="text-gray-700 mb-4">
          This chatbot is designed to provide information about autism support services for children in Connecticut.
          Feel free to ask questions about available resources, support groups, or specific services such as food banks or providers.
        </p>
        
        <div className="flex flex-wrap gap-2">
          {commonQueries.map((item, index) => (
            <button
              key={index}
              onClick={() => handleSendMessage(item.query)}
              className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm transition-colors duration-200"
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-4 mb-4 w-full h-96 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`mb-4 ${message.isBot ? 'text-left' : 'text-right'}`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                message.isBot
                  ? 'bg-purple-100 text-purple-800 whitespace-pre-line'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              <Message outputText={message.text} />
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleFormSubmit} className="flex gap-2 w-full">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message here..."
          className="flex-grow p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          type="button"
          onClick={toggleListening}
          className={`p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors duration-300 ${
            listening 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-green-500 hover:bg-green-600'
          } text-white`}
        >
          {listening ? <MicOff size={24} /> : <Mic size={24} />}
        </button>
        <button
          type="submit"
          onClick={offListening}
          className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-2 rounded-lg hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors duration-300"
        >
          <Send size={24} />
        </button>
      </form>
    </>
  );

  // Render the data sources page
  const renderDataSources = () => (
    <div className="bg-white bg-opacity-90 rounded-lg shadow-lg p-6 w-full">
      <h2 className="text-2xl font-semibold mb-4 text-purple-800">Data Sources</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <a href="https://portal.ct.gov/-/media/dph/cyshcn/ct-collaborative-autism-services-resource-directory.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Connecticut Collaborative Autism Services Resource Directory
          </a>
        </li>
        <li>
          <a href="https://portal.ct.gov/oca/miscellaneous/miscellaneous/resources/resource-list" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Resource List - Connecticut Office of the Child Advocate
          </a>
        </li>
        <li>
          <a href="https://portal.ct.gov/dph/wic/wic" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Connecticut WIC Program
          </a>
        </li>
        <li>
          <a href="https://portal.ct.gov/dss/archived-folder/temporary-family-assistance---tfa" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Temporary Family Assistance - Connecticut Department of Social Services
          </a>
        </li>
        <li>
          <a href="https://www.connecticutchildrens.org/specialties-conditions/developmental-behavioral-pediatrics/autism-spectrum-disorder-asd" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Connecticut Children's Autism Spectrum Disorder Care
          </a>
        </li>
        <li>
          <a href="https://portal.ct.gov/dds/supports-and-services/family-support-and-services?language=en_US" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Family Support Services - Connecticut Department of Developmental Services
          </a>
        </li>
        <li>
          <a href="https://www.thediaperbank.org/diaper-connections/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Diaper Connections - The Diaper Bank
          </a>
        </li>
        <li>
          <a href="https://calendar.google.com/calendar/u/0/embed?height=600&wkst=1&bgcolor=%23ffffff&ctz=America/New_York&showPrint=0&src=Y3Rmb29kYmFuay5ldmVudHNAZ21haWwuY29t&color=%237986CB&showTitle=0&showNav=0&showCalendars=1&mode=AGENDA" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Autism Events Calendar - Google Calendar
          </a>
        </li>
        <li>
          <a href="https://ctserc.org/services" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Connecticut State Education Resource Center - Services
          </a>
        </li>
        <li>
          <a href="https://www.birth23.org/programs/?town&program_type" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Birth to 23 Early Intervention Programs
          </a>
        </li>
        <li>
          <a href="https://www.healthline.com/health/autism#outlook" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Healthline - Autism Outlook
          </a>
        </li>
        <li>
          <a href="https://autism.org/what-is-autism/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Autism.org - What is Autism?
          </a>
        </li>
        <li>
          <a href="https://kidshealth.org/en/parents/milestones.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            KidsHealth - Autism Milestones
          </a>
        </li>
        <li>
          <a href="https://www.mayoclinic.org/diseases-conditions/autism-spectrum-disorder/symptoms-causes/syc-20352928" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Mayo Clinic - Autism Spectrum Disorder
          </a>
        </li>
        <li>
          <a href="https://childmind.org/guide/autism-spectrum-disorder-quick-guide/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Child Mind Institute - Autism Spectrum Disorder Quick Guide
          </a>
        </li>
        <li>
          <a href="https://www.cdc.gov/autism/data-research/?CDC_AAref_Val=https://www.cdc.gov/ncbddd/autism/data.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            CDC - Autism Data and Research
          </a>
        </li>
        <li>
          <a href="https://www.nimh.nih.gov/health/topics/autism-spectrum-disorders-asd" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            National Institute of Mental Health - Autism Spectrum Disorders
          </a>
        </li>
        <li>
          <a href="https://www.autismspeaks.org/signs-autism" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Autism Speaks - Signs of Autism
          </a>
        </li>
        <li>
          <a href="https://www.211childcare.org/providers.json" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            211 Child Care Providers - JSON
          </a>
        </li>
      </ul>
    </div>
  );
  

  if (!browserSupportsSpeechRecognition) {
    return <div>Browser doesn't support speech recognition.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-200 flex relative overflow-hidden">
      {/* Background pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Navigation sidebar */}
      <div 
        className={`fixed h-full transition-all duration-300 ease-in-out ${
          isNavOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0 hidden'
        }`}
      >
        <nav className="h-full bg-white bg-opacity-90 p-4 shadow-lg z-10">
          <h2 className="text-xl font-semibold mb-4 text-purple-800">Navigation</h2>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => {
                  setCurrentPage('chatbot');
                  if (window.innerWidth < 768) setIsNavOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-200 ${
                  currentPage === 'chatbot' ? 'bg-purple-100 text-purple-800' : 'hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="inline-block mr-2" size={18} />
                Chatbot
              </button>
            </li>
            <li>
            <button
                onClick={() => {
                  setCurrentPage('map');
                  if (window.innerWidth < 768) setIsNavOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-200 ${
                  currentPage === 'map' ? 'bg-purple-100 text-purple-800' : 'hover:bg-gray-100'
                }`}
              >
                <Map className="inline-block mr-2" size={18} />
                Food Banks Map
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setCurrentPage('data-sources');
                  if (window.innerWidth < 768) setIsNavOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-200 ${
                  currentPage === 'data-sources' ? 'bg-purple-100 text-purple-800' : 'hover:bg-gray-100'
                }`}
              >
                <FileText className="inline-block mr-2" size={18} />
                Data Sources
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main content area */}
      <div className={`flex-grow flex flex-col p-4 z-10 duration-100 ${
        isNavOpen ? 'ml-64' : 'ml-0'
      }`}>
        <header className="bg-gradient-to-r from-purple-400 to-blue-500 text-white p-4 shadow-md rounded-lg mb-4 flex justify-between items-center">
          <button
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="text-white focus:outline-none hover:bg-white/10 p-2 rounded-lg transition-colors duration-200"
          >
            {isNavOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="text-2xl font-bold text-center flex-grow">Parent Support Resources</h1>
          <div className="w-6"></div> {/* Spacer for centering */}
        </header>

        <main className="flex-grow flex flex-col items-center justify-center">
        {currentPage === 'chatbot' 
            ? renderChatbot() 
            : currentPage === 'data-sources'
            ? renderDataSources()
            : <AutismResourceMap />}
        </main>
      </div>
    </div>
  );
}