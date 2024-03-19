# MS Entra ID node-red authentication

MS Entra ID authentication plugin for Node-Red.

This module is a wrapper for the `passport-azure-ad` passport module with some default values and type completion to quickly get started.

## Installation

In your Node-Red instance (usually `~/.node-red`), install this module with the following command:

```bash
npm install @tq-bit/node-red-auth-azure-oidc
```

## Create an app in MS Entra ID

1. Go to [Azure Portal](https://portal.azure.com/)
2. Open Entra ID
3. Go to 'Enterprise Applications'
4. Click on 'New application'
5. Click on 'Create your own application'
6. Select 'Register an application to integrate with Microsoft Entra ID'
7. Fill out account details (make sure to add a Redirect URL that's equal to the one in the Node-Red instance)
8. Jot down the application ID (client-id) and secret (client-secret)

## Configuration

In the `settings.js` file, add the following:

```javascript
adminAuth: require('node-red-auth-azure-oidc')({
	tenant: '<subscription-id> or <tenant-id>',
	users: [
		{
			username: 'tq-bit',
			permissions: '*', // or 'read'
		},
	],
	clientID: '<client-id> for this application',
	clientSecret: '<client-secret> for this application',
	redirectUrl: 'http://localhost:1880/auth/strategy/callback', // or the URL of whereever you have deployed Node-Red
	responseType: 'code', // or  'id_token', 'id_token code', 'code id_token'
	allowHttpForRedirectUrl: true,
  // Further properties are available using code completion intellisense (CTRL+Space)
}),
```

### Further config

Instead of using this module's API, you can use the passport-azure-ad module options directly. [Please refer to their documentation for more information](https://www.passportjs.org/packages/passport-azure-ad/).

### Implement this package yourself

In your `settings.js` file, you can replace this module with your own implementation. Start here:

```js
adminAuth: {
	type: 'strategy',
  users: [
		{
			username: 'tq-bit',
			permissions: '*', // or 'read'
		},
	],
	strategy: {
		name: 'azuread-openidconnect',
		label: 'Sign in with Azure',
		icon: 'fa-windows',
		strategy: require('passport-azure-ad').OIDCStrategy,
		options: {
			clientID: "<client-id>",
			redirectUrl: "http://localhost:1880/auth/strategy/callback",
			identityMetadata: 'https://login.microsoftonline.com/<subscription-id>/v2.0/.well-known/openid-configuration',
			responseType: 'code',
			responseMode: 'form_post',
			allowHttpForRedirectUrl: true,
			clientSecret: '<client-secret>'
			callbackMethod: 'POST'
			scope: ['openid', 'email', 'profile'],
			verify: (issuer, secret, profile, done) => {
				// Username for node-red must be set to displayName in Azure
				profile.username = profile.displayName;
				done(null, profile);
			},
		},
	},
};
```

