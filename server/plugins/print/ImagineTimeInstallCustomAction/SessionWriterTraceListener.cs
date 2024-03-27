using System;
using System.Diagnostics;
using System.IO;
using Microsoft.Deployment.WindowsInstaller;

namespace ImagineTimeInstallCustomAction
{
    public class SessionLogWriterTraceListener : TextWriterTraceListener, IDisposable
    {
        protected MemoryStream listenerStream;
        protected Session installSession;

        private bool isDisposed;

        public SessionLogWriterTraceListener(Session session)
        {
            listenerStream = new MemoryStream();
            Writer = new StreamWriter(listenerStream);
            installSession = session;
        }

        public void CloseAndWriteLog()
        {
            if (listenerStream != null && installSession != null)
            {
                Flush();

                if (listenerStream.Length > 0)
                {
                    listenerStream.Position = 0;

                    using (var listenerStreamReader = new StreamReader(listenerStream))
                    {
                        installSession.Log(listenerStreamReader.ReadToEnd());
                    }
                }

                Close();
                Dispose();
                installSession = null;
            }
        }

        public new void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dipose(bool disposing)
        {
            if (!isDisposed)
            {
                if (disposing)
                {
                    if (Writer != null)
                    {
                        Writer.Close();
                        Writer.Dispose();
                        Writer = null;
                    }

                    if (listenerStream != null)
                    {
                        listenerStream.Close();
                        listenerStream.Dispose();
                        listenerStream = null;
                    }

                    installSession = null;
                }

                isDisposed = true;
            }

            base.Dispose(disposing);
        }
    }
}