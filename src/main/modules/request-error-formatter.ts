/**
 * Request error formatting utilities
 */

export class RequestErrorFormatter {
  public static formatNetworkError(error: any, url: string): string {
    const errorInfo = {
      error: 'Network Error',
      message: error.message || 'Failed to connect to server',
      url,
      code: error.code,
      details: this.getDetailedErrorMessage(error),
      suggestions: this.getErrorSuggestions(error),
      timestamp: new Date().toISOString(),
    };

    return JSON.stringify(errorInfo, null, 2);
  }

  public static formatDecompressionError(error: any): string {
    const errorInfo = {
      error: 'Decompression Error',
      message: 'Failed to decompress response body',
      details: error.message || 'Invalid compressed data received from server',
      suggestions: [
        'The server may have sent corrupted compressed data',
        'Try disabling compression in request headers (remove Accept-Encoding)',
        'Contact the API provider if the issue persists',
      ],
      timestamp: new Date().toISOString(),
    };

    return JSON.stringify(errorInfo, null, 2);
  }

  public static formatGeneralError(error: any, url: string): string {
    const errorInfo = {
      error: 'Request Failed',
      message: error.message || 'An unexpected error occurred',
      url,
      details: this.getDetailedErrorMessage(error),
      suggestions: this.getErrorSuggestions(error),
      timestamp: new Date().toISOString(),
    };

    return JSON.stringify(errorInfo, null, 2);
  }

  public static getErrorStatusCode(error: any): number {
    // Network errors
    if (error.code === 'ENOTFOUND') return 0; // DNS resolution failed
    if (error.code === 'ECONNREFUSED') return 0; // Connection refused
    if (error.code === 'ETIMEDOUT') return 0; // Connection timeout
    if (error.code === 'ECONNRESET') return 0; // Connection reset
    if (error.code === 'EPIPE') return 0; // Broken pipe
    if (error.code === 'EHOSTUNREACH') return 0; // Host unreachable
    if (error.code === 'ENETUNREACH') return 0; // Network unreachable

    // SSL/TLS errors
    if (error.code === 'CERT_HAS_EXPIRED') return 495; // SSL Certificate Error
    if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') return 495;
    if (error.code === 'SELF_SIGNED_CERT_IN_CHAIN') return 495;
    if (error.code?.startsWith('ERR_TLS_')) return 495;

    // HTTP/Protocol errors
    if (error.code === 'ERR_INVALID_URL') return 400; // Bad Request
    if (error.code === 'ERR_INVALID_PROTOCOL') return 400;

    return 500; // Internal Server Error (fallback)
  }

  public static getErrorTitle(error: any): string {
    if (error.code === 'ENOTFOUND') return 'DNS Resolution Failed';
    if (error.code === 'ECONNREFUSED') return 'Connection Refused';
    if (error.code === 'ETIMEDOUT') return 'Connection Timeout';
    if (error.code === 'ECONNRESET') return 'Connection Reset';
    if (error.code === 'EPIPE') return 'Broken Pipe';
    if (error.code === 'EHOSTUNREACH') return 'Host Unreachable';
    if (error.code === 'ENETUNREACH') return 'Network Unreachable';
    if (error.code === 'CERT_HAS_EXPIRED') return 'SSL Certificate Expired';
    if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE')
      return 'SSL Certificate Invalid';
    if (error.code === 'SELF_SIGNED_CERT_IN_CHAIN')
      return 'Self-Signed Certificate';
    if (error.code?.startsWith('ERR_TLS_')) return 'TLS/SSL Error';
    if (error.code === 'ERR_INVALID_URL') return 'Invalid URL';
    if (error.code === 'ERR_INVALID_PROTOCOL') return 'Invalid Protocol';

    return 'Request Failed';
  }

  private static getDetailedErrorMessage(error: any): string {
    const code = error.code;

    if (code === 'ENOTFOUND') {
      return 'The domain name could not be resolved. Check if the URL is correct and your DNS settings.';
    }
    if (code === 'ECONNREFUSED') {
      return 'The server actively refused the connection. The service may not be running on the specified port.';
    }
    if (code === 'ETIMEDOUT') {
      return 'The connection attempt timed out. The server may be down or unreachable.';
    }
    if (code === 'ECONNRESET') {
      return 'The connection was reset by the server. This may indicate a server-side issue.';
    }
    if (code === 'CERT_HAS_EXPIRED') {
      return 'The SSL certificate has expired. The server needs to renew its certificate.';
    }
    if (code === 'SELF_SIGNED_CERT_IN_CHAIN') {
      return 'The server is using a self-signed certificate which cannot be verified.';
    }

    return error.message || 'An unknown error occurred during the request';
  }

  private static getErrorSuggestions(error: any): string[] {
    const code = error.code;
    const suggestions: string[] = [];

    if (code === 'ENOTFOUND') {
      suggestions.push('Verify the URL is correct');
      suggestions.push('Check your internet connection');
      suggestions.push('Try using the IP address instead of domain name');
    } else if (code === 'ECONNREFUSED') {
      suggestions.push('Verify the server is running');
      suggestions.push('Check the port number is correct');
      suggestions.push('Ensure no firewall is blocking the connection');
    } else if (code === 'ETIMEDOUT') {
      suggestions.push('Check your internet connection');
      suggestions.push('Verify the server is responding');
      suggestions.push('Try increasing the timeout value');
    } else if (
      code === 'CERT_HAS_EXPIRED' ||
      code === 'SELF_SIGNED_CERT_IN_CHAIN'
    ) {
      suggestions.push('Contact the API provider to fix their SSL certificate');
      suggestions.push(
        'For development only: You can disable SSL verification (not recommended for production)'
      );
    } else {
      suggestions.push('Check the request configuration');
      suggestions.push('Verify the server is accessible');
      suggestions.push('Review any recent changes to the request');
    }

    return suggestions;
  }
}
