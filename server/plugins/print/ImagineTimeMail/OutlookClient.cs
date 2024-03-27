using System;
using System.Text;
using System.Text.RegularExpressions;

namespace ImagineTimeMail
{
    public class OutlookClient : IEmailClient
    {
        private const int OlBodyFormatText = 1;
        private const int OlBodyFormatHtml = 2;
        private const int OlBodyFormatRichText = 3;

        private static bool outlookTypeWasDetermined;
        private static Type outlookType;

        private static Type OutlookType
        {
            get
            {
                if (!outlookTypeWasDetermined)
                {
                    outlookTypeWasDetermined = true;
                    outlookType = Type.GetTypeFromProgID("Outlook.Application");
                }

                return outlookType;
            }
        }

        public virtual bool IsOutlookInstalled => OutlookType != null;

        public bool IsClientInstalled => IsOutlookInstalled;

        public bool ShowEmailClient(Email email)
        {
            if (!IsClientInstalled)
            {
                return false;
            }

            try
            {
                return ShowOutlook(email);
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        private bool ShowOutlook(Email email)
        {
            dynamic outlook = Activator.CreateInstance(OutlookType);

            if (outlook == null)
                return false;

            var mail = outlook.CreateItem(0);

            mail.To = string.Join(";", email.To);
            //mail.CC = "";
            //mail.BCC = "";
            mail.Subject = email.Subject;
            //mail.BodyFormat = 2; // 1 = Text, 2 = HTML
            mail.Display();

            // We need to set the body after the mail is displayed to not overwrite the signature
            if (mail.BodyFormat == OlBodyFormatHtml)
            {
                AddHtmlBody(mail, email.Body);
            }
            else
            {
                AddTextBody(mail, email.Body);
            }

            return true;
        }

        private void AddHtmlBody(dynamic mail, string body)
        {
            if (!body.Contains("<"))
            {
                body = ConvertToHtml(body);
            }

            string html = mail.HtmlBody;

            var bodyMatch = Regex.Match(html, "<body .*?>");

            if (bodyMatch.Success)
            {
                var bodyTag = bodyMatch.Groups[0].Value;
                html = html.Replace(bodyTag, bodyTag + body);
            }
            else
            {
                html = "<html><body>" + body + "</body></html>";
            }

            mail.HtmlBody = html;
        }

        private void AddTextBody(dynamic mail, string body)
        {
            mail.Body = body + mail.Body;
        }

        private string ConvertToHtml(string body)
        {
            var sb = new StringBuilder();

            foreach (var line in body.Split('\n'))
            {
                sb.AppendFormat("<p class=\"MsoNormal\">{0}</p>", line.Trim('\r'));
            }

            return sb.ToString();
        }
    }
}