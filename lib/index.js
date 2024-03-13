/**
 * Configuration object for authentication.
 * @typedef {Object} DefaultAzureAuthConfig
 * @property {string} [identityMetadata] - The URL for the identity metadata
 * @property {string} clientID - The client ID
 * @property {'code' | 'id_token' | 'id_token code' | 'code id_token'} responseType - The response type
 * @property {'form_post' | 'query'?} [responseMode] - The response mode
 * @property {string} redirectUrl - The redirect URL
 * @property {boolean} [allowHttpForRedirectUrl] - Whether to allow HTTP for redirect URL
 * @property {string} [clientSecret] - The client secret. Mandatory if 'responseType' is not 'id_token' or for a non B2C client
 * @property {boolean?} [validateIssuer] - Whether to validate issuer
 * @property {boolean?} [isB2C] - Whether it's B2C
 * @property {string?} [issuer] - The issuer
 * @property {boolean?} [passReqToCallback] - Whether to pass request to callback
 * @property {string[]?} [scope] - An array of scopes the client is requesting
 * @property {'info' | 'warn' | 'error'?} [loggingLevel] - The logging level
 * @property {boolean?} [loggingNoPII] - Whether to log personally identifiable information
 * @property {number?} [nonceLifetime] - The nonce lifetime in seconds
 * @property {number?} [nonceMaxAmount] - The maximum number of nonces kept in session or cookies
 * @property {boolean?} [useCookieInsteadOfSession] - Whether to use cookie instead of session
 * @property {boolean?} [cookieSameSite] - The same-site attribute for cookies
 * @property {string[]?} [cookieEncryptionKeys] - The encryption keys for cookies
 * @property {{key: string, iv: string}?} [clockSkew] - The clock skew
 * @property {{port: string, host: string, protocol: string}?} [proxy] - The proxy configuration
 *
 * @typedef {Object} ModuleAzureAuthConfigExtension
 * @property {string} tenant - Name or ID of the tenant against which is authenticated
 * @property {'GET' | 'POST'} [callbackMethod]
 * @property {{username: string, permissions: 'read' | '*'}[]} users
 *
 * @typedef {DefaultAzureAuthConfig & ModuleAzureAuthConfigExtension} ModuleOptions
 */

function verifyRequiredOptions(options) {
	const required = ['tenant', 'clientID', 'redirectUrl', 'users'];
	const missing = required.filter((key) => !options[key]);
	if (missing.length > 0) throw new Error('Missing required options: ' + missing.join(', '));
	if (options.responseType.includes('code') && !options.clientSecret) {
		throw new Error('Client secret is mandatory if response type is not "id_token"');
	}
}

function assembleAzureLoginUrl({ tenant, version = '2.0' }) {
	return `https://login.microsoftonline.com/${tenant}/v${version}/.well-known/openid-configuration`;
}

/**
 *
 * @param {ModuleOptions} options
 * @returns
 */
module.exports = function (options) {
	verifyRequiredOptions(options);
	return {
		type: 'strategy',
		users: options.users,
		strategy: {
			name: 'azuread-openidconnect',
			label: 'Sign in with Azure',
			icon: 'fa-windows',
			strategy: require('passport-azure-ad').OIDCStrategy,
			options: {
				...options,
				clientID: options.clientID,
				redirectUrl: options.redirectUrl,
				identityMetadata:
					options.identityMetadata || assembleAzureLoginUrl({ tenant: options.tenant }),
				responseType: options.responseType || 'code',
				responseMode: options.responseMode || 'form_post',
				allowHttpForRedirectUrl: options.allowHttpForRedirectUrl || false,
				clientSecret: options.clientSecret,
				callbackMethod: options.callbackMethod || options.responseMode === 'query' ? 'GET' : 'POST',
				scope: options.scope || ['openid', 'email', 'profile'],
				verify: (issuer, secret, profile, done) => {
					// Username for node-red must be set to displayName in Azure
					profile.username = profile.displayName;
					done(null, profile);
				},
			},
		},
	};
};
