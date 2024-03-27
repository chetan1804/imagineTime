using Microsoft.Win32;

namespace ImagineTimeMail
{
    public class EmailClientFactory : IEmailClientFactory
    {
        private readonly RegistryKey registry;

        public EmailClientFactory()
        {
            registry = Registry.CurrentUser;
        }

        public IEmailClient CreateEmailClient()
        {
            var defaultMailClientName = FindDefaultMailClientName();

            if (defaultMailClientName != null)
            {
                var outlookClient = CreateOutlookClient();
                if (defaultMailClientName.Contains("Outlook") && outlookClient.IsOutlookInstalled)
                    return outlookClient;
            }

            var mapiClient = CreateMapiClient();
            if (mapiClient.IsMapiClientInstalled)
            {
                mapiClient.StartInOwnThread = true;

                return mapiClient;
            }

            return null;
        }

        protected virtual OutlookClient CreateOutlookClient()
        {
            return new OutlookClient();
        }

        protected virtual MapiClient CreateMapiClient()
        {
            return new MapiClient();
        }

        private string FindDefaultMailClientName()
        {
            var mailClient = registry.GetValue(@"HKEY_CURRENT_USER\SOFTWARE\Clients\Mail", "");
            if (mailClient != null)
                return mailClient.ToString();

            mailClient = registry.GetValue(@"HKEY_LOCAL_MACHINE\SOFTWARE\Clients\Mail", "");
            if (mailClient != null)
                return mailClient.ToString();

            return null;
        }
    }
}