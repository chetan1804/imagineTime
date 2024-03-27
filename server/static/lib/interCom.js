(function() {
    var w = window;
    var ic = w.Intercom;
    console.log("testing11")
    if (typeof ic === "function") {
        ic('reattach_activator');
        ic('update', w.intercomSettings);
    } else {
        var d = document;
        var i = function() {
            i.c(arguments);
        };
        i.q = [];
        i.c = function(args) {
            i.q.push(args);
        };
        w.Intercom = i;
        var l = function() {
            var s = d.createElement('script');
            s.type = 'text/javascript';
            s.async = true;
            s.src = 'https://widget.intercom.io/widget/ygr5wwhj';
            var x = d.getElementsByTagName('script')[0];
            x.parentNode.insertBefore(s, x);
        };

        if (w.attachEvent) {
            w.attachEvent('onload', l);
        } else {
            w.addEventListener('load', l, false);
        }

        w.addEventListener("load", (event) => {
            let intercomLauncherIcon = localStorage.getItem('intercomLauncherIcon');
            intercomLauncherIcon = intercomLauncherIcon === "disabled" ? intercomLauncherIcon : "enabled";
            let intercomNode = document.getElementsByClassName('intercom-lightweight-app') && document.getElementsByClassName('intercom-lightweight-app')[0];
            if (intercomNode && intercomLauncherIcon === "disabled") {
                intercomNode.style.display = "none";
            } else if (intercomNode && intercomLauncherIcon === "enabled") {
                intercomNode.style.display = "block";
            }
            localStorage.setItem('intercomLauncherIcon', intercomLauncherIcon);
        });
    }
})();