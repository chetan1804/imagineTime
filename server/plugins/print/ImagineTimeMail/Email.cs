using System.Collections.Generic;

namespace ImagineTimeMail
{
    public class Email
    {
        public Email()
        {
            To = new List<string>();
        }

        public ICollection<string> To { get; }
        public string Subject { get; set; }
        public string Body { get; set; }
    }
}