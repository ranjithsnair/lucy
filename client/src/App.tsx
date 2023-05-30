import { useState, useRef } from 'react';
import './App.css';
import {
  ChatIcon, SendIcon, Card, Flex, Avatar, Text, Chat, AcceptIcon, TextArea,
  ChatMessage, PersonIcon, Divider, Image, Button, PaperclipIcon, Alert,
  Menu, TrashCanIcon
} from "@fluentui/react-northstar"
import { v4 as uuidv4 } from "uuid";

function App() {
  const [isTyping, setIsTyping] = useState(false)
  const [userWarning, setUserWarning] = useState("")
  const [chatMode, setChatMode] = useState("chat")
  const [fileContent, setFileContent] = useState("")
  const [selectedFile, setSelectedFile] = useState("")
  const [message, setMessage] = useState("")
  const [docs, setDocs] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([
    {
      key: uuidv4(),
      gutter: (<Avatar
        image="./images/bot.jpg"
        status={{
          color: 'green',
          icon: <AcceptIcon />
        }}
      />),
      message: (
        <ChatMessage
          author="Lucy"
          content="Hi there, I'm Lucy, an AI assistant! How can I help you?"
          timestamp={new Date().toLocaleTimeString()}
        />
      ),
      variables: {role: "assistant", content: "Hi there, I'm Lucy, an AI assistant! How can I help you?"}
    }
  ])

  const uploadRef = useRef(null);
  const scrollRef = useRef(null);

  function sendMessage() {
    if (message === "") {
      return;
    }

    setMessage("");
    var newMessages = messages.concat([
      {
        key: uuidv4(),
        gutter: (<Avatar icon={<PersonIcon />} />),
        message: (
          <Chat.Message content={message} author="User" timestamp={new Date().toLocaleTimeString()} mine />
        ),
        contentPosition: 'end',
        variables: {role: "user", content: message}
      }
    ])
    setMessages(newMessages);
    setTimeout(() => (scrollRef.current as any).scrollTop = (scrollRef.current as any).scrollHeight, 100);
    setIsTyping(true);

    var chatHistory = newMessages.map(x => ({
      role: x.variables.role,
      content: x.variables.content
    })) as any;

    if(chatMode === "query" && fileContent !== ""){
      var lastChat = chatHistory.findLast(() => true) as any;
      lastChat.content = `Based on the following file contents, ${lastChat?.content} File: ${selectedFile} ${fileContent}`
    }

    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatHistory
      })
    };
    
    fetch('%API_URL%/chat', options)
      .then(response => response.json())
      .then(data => {
        setIsTyping(false);
        if (data.choices != null && data.choices.length > 0) {
          newMessages = newMessages.concat([
            {
              key: uuidv4(),
              gutter: (<Avatar
                image="./images/bot.jpg"
                status={{
                  color: 'green',
                  icon: <AcceptIcon />
                }}
              />),
              message: (
                <ChatMessage
                  author="Lucy"
                  content={data.choices[0].message.content}
                  timestamp={new Date().toLocaleTimeString()}
                />
              ),
              variables: {role: "assistant", content: data.choices[0].message.content}
            }
          ])
          setMessages(newMessages);
          setTimeout(() => (scrollRef.current as any).scrollTop = (scrollRef.current as any).scrollHeight, 100);
        }
      })
      .catch(error => {
        setIsTyping(false);
        console.error(error);
        setTimeout(() => (scrollRef.current as any).scrollTop = (scrollRef.current as any).scrollHeight, 100);
      });
  }

  function switchToChatMode() {
    setUserWarning("");
    setChatMode('chat');
    setFileContent("");
    setSelectedFile("")
  }

  function attachDocument(fileName: string, content: string) {
    setUserWarning(`Lucy is now available for you to ask questions specifically related to the file named ${fileName}`);
    setChatMode('query');
    setFileContent(content);
    setSelectedFile(fileName);
  }

  function uploadDocument() {
    if (uploadRef.current != null) {
      (uploadRef.current as any).click();
    }
  }

  function handleDocumentClick(event: any, data: any): void {
    attachDocument(data.content, data.variables.content);
  }

  function clearDocuments() {
    setDocs([]);
  }

  function addDocument(event: any): void {
    const document = event.target.files && event.target.files[0];
    if (!document) {
      return;
    }

    event.target.value = null;

    var oldDocument = docs.find(doc => doc.key === document.name);
    if (oldDocument !== undefined) {
      return;
    }

    const data = new FormData();
    data.append("file", document, document.name);

    const options = {
      method: 'POST',
      body: data
    };
    
    fetch('%API_URL%/files', options)
      .then(response => response.json())
      .then(data => {
        var newDocument = {
          key: data.fileName,
          content: data.fileName,
          variables: {content: data.content},
          icon: (
            <Image
              src="./images/document.png"
              avatar
            />
          ),
        }
    
        var newDocuments = docs.concat([newDocument]);
        setDocs(newDocuments);
      })
      .catch(error => {
        console.error(error);
      });
  }

  function submitOnEnter(event: any) {
    if (event.keyCode === 13 && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <Flex column style={{ backgroundColor: 'rgb(243, 242, 241)' }}>
      <Flex.Item>
        <h1 style={{ marginLeft: 20 }}>Lucy</h1>
      </Flex.Item>
      <Flex style={{ backgroundColor: 'rgb(243, 242, 241)' }}>
        <Flex.Item size="size.quarter">
          <Card inverted>
            <Card.Body>
              <Flex column gap='gap.smaller'>
                <Flex.Item align='end'>
                  <Button hidden={docs.length === 0} icon={<TrashCanIcon />} text primary content="Clear" onClick={clearDocuments} />
                </Flex.Item>
                <Menu
                  vertical
                  fluid
                  onItemClick={handleDocumentClick}
                  hidden={docs.length === 0}
                  items={docs} />
                <Flex.Item align='end'>
                  <Button hidden={docs.length === 0} icon={<ChatIcon />} text primary content="Switch to chat mode" onClick={switchToChatMode} disabled={chatMode === "chat" ? true : false} />
                </Flex.Item>
                <Alert content="No documents available" visible={docs.length === 0} variables={{ oof: true }} />
              </Flex>
            </Card.Body>
          </Card>
        </Flex.Item>
        <Card fluid inverted>
          <Card.Header>
            <Flex gap="gap.small">
              <Avatar
                image="./images/bot.jpg"
                status={{
                  color: 'green',
                  icon: <AcceptIcon />
                }}
              />
              <Flex column>
                <Text content="Lucy" weight="bold" />
                <Text content={isTyping ? 'Typing' : 'Available'} size="small" />
              </Flex>
            </Flex>
          </Card.Header>
          <Card.Body>
            <Flex column style={{ height: '65vh' }}>
              <Divider />
              <div
                ref={scrollRef}
                style={{
                  overflow: 'scroll'
                }}
              >
                <Chat items={messages} />
              </div>
            </Flex>
          </Card.Body>
          <Card.Footer fitted>
            <Flex column gap="gap.small">
              <Text weight='bold' style={{ marginLeft: 45 }}>{userWarning}</Text>
              <Flex gap="gap.small">
                <input
                  style={{ display: 'none' }}
                  ref={uploadRef}
                  type="file"
                  accept="application/pdf"
                  onChange={addDocument}
                />
                <Button circular icon={<PaperclipIcon />} onClick={uploadDocument} />
                <TextArea fluid inverted placeholder="Type a new message" maxLength={4000} value={message} onChange={(event: any) => setMessage(event.target.value)} required onKeyDown={submitOnEnter} />
                <Button circular icon={<SendIcon />} primary onClick={sendMessage} />
              </Flex>
            </Flex>
          </Card.Footer>
        </Card>
      </Flex>
    </Flex>
  );
}

export default App;

