using System;
using System.Diagnostics;
using System.IO;
using System.Web;
using System.Windows.Forms;
using RestSharp;

namespace ImagineTime
{
    public partial class UploadForm : Form
    {
        private const string errorNetworkProblem = "Network connection error. Please check your connection and try again.";
        private const string errorRequiredInput = "Enter the required information!";

        private const string traceSourceName = "ImagineTime";

        private static readonly TraceSource logEventSource = new TraceSource(traceSourceName);

        private Firm firm { get; }
        private User user { get; }

        private readonly Timer timer = new Timer();

        public UploadForm(User user, Firm firm)
        {
            InitializeComponent();

            this.user = user;
            this.firm = firm;
        }

        private void DisplayErrorMessage(string message)
        {
            filenameTextBox.Text = string.Empty;

            errorLabel.Text = message;
            errorLabel.Visible = true;
        }

        private void TimerTick(object sender, EventArgs e)
        {
            this.Close();
        }

        private void FilenameButton_Click(object sender, EventArgs e)
        {
            errorLabel.Text = "";
            errorLabel.Visible = false;

            var filename = filenameTextBox.Text;

            if (string.IsNullOrEmpty(filename))
            {
                errorLabel.Text = errorRequiredInput;
                errorLabel.Visible = true;

                return;
            }

            filenameLabel.Visible = false;
            filenameTextBox.Visible = false;

            var client = new RestClient("https://demo.imaginetime.com")
            {
                CookieContainer = Service.LoadCookies()
            };

            var request = new RestRequest("/api/files/", Method.POST)
            {
                AlwaysMultipartFormData = true
            };

            request.AddParameter("_firm", firm._id);
            request.AddParameter("status", "visible");

            var mimeType = MimeMapping.GetMimeMapping(filename);

            request.AddFileBytes("0", File.ReadAllBytes(filename), filename, mimeType);

            var response = client.Execute<UploadResponse>(request);

            if (response.IsSuccessful && response.Data != null && response.Data.success)
            {
                uploadingLabel.Text = "Upload complete!";

                // Timer to automatically close the window.
                timer.Interval = 4000;
                timer.Tick += new EventHandler(TimerTick);
                timer.Start();
            }
            else
            {
                logEventSource.TraceEvent(TraceEventType.Error,
                    (int)TraceEventType.Error,
                    errorNetworkProblem);

                DisplayErrorMessage(errorNetworkProblem);
            }
        }
    }
}
