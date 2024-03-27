let baseUrl = window.appUrl;
let domain = 'imaginetime';

// import
import imagineTimeImage from './imagineTimeImage.js.jsx';

if (baseUrl && baseUrl.indexOf('lexshare.io') > -1) {
    domain = 'lexshare';
}

// img from server imaginetime
imagineTimeImage.poweredby = '/img/powered-by.png';
imagineTimeImage.itAdminLogo = '/img/it-admin-logo.png';
imagineTimeImage.icon = '/img/icon.png';
imagineTimeImage.logoWhite = '/img/logo-white.png';
imagineTimeImage.logoBlack = '/img/logo-black.png';

// img from server lexshare
const lexShareImage = _.cloneDeep(imagineTimeImage);
lexShareImage.poweredby = '/img/lexshare-powered-by.png';
lexShareImage.itAdminLogo = '/img/lexshare-it-admin-logo.png';
lexShareImage.icon = '/img/lexshare-icon.png';
lexShareImage.logoWhite = '/img/lexshare-logo-white-blue.png';
lexShareImage.logoBlack = '/img/lexshare-logo-black.png';

const obj = {
    imaginetime: {
        title: 'ImagineTime'
        , url: 'https://imaginetime.com'
        , host: 'imaginetime.com'
        , desk: {
            supportUrl: 'https://imaginetime.freshdesk.com/support/home'
        }
        , email: {
            support: 'support@imaginetime.com'
            , sale: 'sales@imaginetime.net'
            , noreply: 'no-reply@imaginetime.com'
        }
        , image: imagineTimeImage
    }
    , lexshare: {
        title: 'LexShare'
        , url: 'https://www.lexshare.io'
        , host: 'lexshare.io'
        , desk: {
            supportUrl: null // 'https://lexshare.freshdesk.com/support/home' need to build this lin
        }
        , email: {
            support: 'support@lexshare.io'
            , sale: 'sales@lexshare.io'
            , noreply: 'no-reply@lexshare.io'
        }
        , image: lexShareImage
    }
}

const brandingName = obj[domain];

console.log('baseUrl', window.appUrl);
console.log('brandingName', brandingName);
console.log('domain', domain);

export default brandingName;