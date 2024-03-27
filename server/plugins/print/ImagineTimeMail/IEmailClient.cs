namespace ImagineTimeMail
{
    public interface IEmailClient
    {
        bool IsClientInstalled { get; }

        bool ShowEmailClient(Email email);
    }
}