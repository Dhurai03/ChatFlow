import { SocketProvider } from '../context/SocketContext';
import ChatLayout from '../components/ChatLayout';
import '../styles/chat.css';

function ChatPage() {
  return (
    <SocketProvider>
      <ChatLayout />
    </SocketProvider>
  );
}

export default ChatPage;
