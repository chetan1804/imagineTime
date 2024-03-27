
let baseUrl = require('../config')[process.env.NODE_ENV].appUrl;
let domain = 'imaginetime';

if (baseUrl && baseUrl.indexOf('lexshare.io') > -1) {
    domain = 'lexshare';
}

const obj = {
    imaginetime: {
        title: 'ImagineTime'
        , class: 'brand-app-it'
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
        , titleIcon: "/favicon.ico?v=4"
        , emailTemplateSuffix: ''
    }
    , lexshare: {
        title: 'LexShare'
        , class: 'brand-app-ls'
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
        , titleIcon: "/favicon-lexshare.ico?v=4"
        , emailTemplateSuffix: '-lexshare'
    }
}
console.log('baseUrl', baseUrl);

exports.brandingName = obj[domain];