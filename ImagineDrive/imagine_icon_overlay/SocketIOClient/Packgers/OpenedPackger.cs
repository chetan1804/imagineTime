using Newtonsoft.Json.Linq;
using SocketIOClient.Response;

namespace SocketIOClient.Packgers
{
    public class OpenedPackger : IUnpackable
    {
        public void Unpack(SocketIO client, string text)
        {
            if (text.StartsWith("{\"sid\":\""))
            {
                var openResponse = new OpenResponse();
                var root = JObject.Parse(text);
                openResponse.Sid = root["sid"].ToString();
                openResponse.PingInterval = root["pingInterval"].ToObject<int>();
                openResponse.PingTimeout = root["pingTimeout"].ToObject<int>();
                client.Open(openResponse);
            }
        }
    }
}
