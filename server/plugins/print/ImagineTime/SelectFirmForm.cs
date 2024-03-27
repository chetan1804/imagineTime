using System;
using System.Diagnostics;
using System.Windows.Forms;
using RestSharp;

namespace ImagineTime
{
    public partial class SelectFirmForm : Form
    {
        private const string errorNetworkProblem = "Network connection error. Please check your connection and try again.";
        private const string errorRequiredInput = "You must select a firm.";

        private const string traceSourceName = "ImagineTime";

        private static readonly TraceSource logEventSource = new TraceSource(traceSourceName);

        private User user { get; }

        public SelectFirmForm(User user)
        {
            InitializeComponent();

            this.user = user;
        }

        private void DisplayErrorMessage(string message)
        {
            errorLabel.Text = message;
            errorLabel.Visible = true;
        }

        private void SelectFirmButton_Click(object sender, EventArgs e)
        {
            errorLabel.Text = "";
            errorLabel.Visible = false;

            if (firmListBox.SelectedIndex == -1)
            {
                errorLabel.Text = errorRequiredInput;
                errorLabel.Visible = true;

                return;
            }

            Service.SaveFirm((Firm)firmListBox.SelectedItem);

            this.Close();
        }

        private void FirmListBox_Format(object sender, ListControlConvertEventArgs e)
        {
            e.Value = e.ListItem is Firm ? ((Firm)e.ListItem).name : "Unknown";
        }

        private void SelectFirmForm_Load(object sender, EventArgs e)
        {
            var client = new RestClient("https://demo.imaginetime.com")
            {
                CookieContainer = Service.LoadCookies()
            };

            var request = new RestRequest("/api/firms/by-_user/{_id}", Method.GET);
            request.AddUrlSegment("_id", user._id);

            var response = client.Execute<FirmResponse>(request);

            if (response.IsSuccessful && response.Data != null && response.Data.success)
            {
                foreach (var firm in response.Data.firms)
                {
                    firmListBox.Items.Add(firm);
                }
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
