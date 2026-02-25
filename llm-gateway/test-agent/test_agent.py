from langchain.tools import tool
from langchain.agents import create_agent
from langchain_ollama import ChatOllama

@tool
def search(query: str) -> str:
    """Search for information."""
    return f"Results for: {query}"

@tool
def get_weather(location: str) -> str:
    """Get weather information for a location."""
    return f"Weather in {location}: Sunny, 72°F"

llm = ChatOllama(
    base_url="http://192.168.1.13:11434",
    model="qwen3:0.6b",
    validate_model_on_init=True,
    temperature=0,
)

agent = create_agent(model=llm, tools=[search, get_weather],system_prompt="You are a helpful assistant. Be concise and accurate.")
result = agent.invoke(
    {"messages": [{"role": "user", "content": "What's the weather in San Francisco?"}]}
)
print(result)