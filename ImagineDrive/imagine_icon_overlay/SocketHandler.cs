using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SocketIOClient;

namespace imagine
{
    public class SocketHandler
    {
        const int TIMEOUT = 8000;
        const string SERVER = "http://localhost:3100";
        static SocketIO client;
        static bool IsConnected = false;
        static bool Connecting = false;
   
        public static async Task Initialize()
        {
            if (Connecting) return;

            Connecting = true;

            if (client != null)
            {
                if (!IsConnected)
                    await client.ConnectAsync();
                return;
            }

            client = new SocketIO(SERVER, new SocketIOOptions { 
                Reconnection = true,
                AllowedRetryFirstConnection = true,
                //EIO = 4,
                //ConnectionTimeout = TimeSpan.FromMilliseconds(TIMEOUT),
            });;
            client.OnConnected += (arg1, arg2) =>
            {
                IsConnected = true;
                Connecting = false;
            };
            client.OnDisconnected += (arg1, arg2) =>
            {
                Connecting = false;
                IsConnected = false;
            };
            client.OnError += (arg1, arg2) =>
            {
                Console.WriteLine(arg2);
            };
            await client.ConnectAsync();
        }

        public static async Task<string> CopyLinkFile(string relativePath)
        {
            return await EmitAck<string>("shareLink", relativePath);
        }

        public static async Task<T> EmitAck<T>(string strEvent, params object[] args)
        {
            await WaitUntilConnected();
            T response = default(T);
            bool hasResult = false;
            await client.EmitAsync(strEvent, (_response) => {
                response = _response.GetValue<T>();
                hasResult = true;
            }, args);

            // wait until result return
            var startTime = DateTime.Now;
            while (!hasResult && (DateTime.Now - startTime).TotalMilliseconds < TIMEOUT)
                await Task.Delay(500);

            if (!hasResult)
                throw new System.Exception("Timeout");
            return response;
        }

        static async Task WaitUntilConnected() 
        {
            await Initialize();
            var startTime = DateTime.Now;
            while (!IsConnected &&
                (DateTime.Now - startTime).TotalMilliseconds < TIMEOUT)
            {
                await Task.Delay(1000);
                await Initialize();
            }
            if (!IsConnected)
                throw new Exception("Timeout");
        }
    }
}
