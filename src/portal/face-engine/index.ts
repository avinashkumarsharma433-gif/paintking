export * from './types';
export * from './LocalFaceCollection';
export * from './LegacyFaceApiProvider';
export * from './RemoteCompreFaceProvider';

import { IFaceEngineProvider } from './types';
import { LegacyFaceApiProvider } from './LegacyFaceApiProvider';
import { RemoteCompreFaceProvider } from './RemoteCompreFaceProvider';
import { LocalFaceCollection } from './LocalFaceCollection';

/**
 * Factory for creating the active Face Engine provider.
 * Allows switching between LocalBrowserProvider (face-api/ONNX) and RemoteCompreFaceProvider.
 */
export function createFaceEngine(providerType: 'legacy' | 'remote' = 'legacy', remoteConfig?: { baseUrl: string; apiKey: string }): IFaceEngineProvider {
  const collection = new LocalFaceCollection();
  if (providerType === 'remote' && remoteConfig?.baseUrl && remoteConfig?.apiKey) {
    return new RemoteCompreFaceProvider(remoteConfig, collection);
  }
  return new LegacyFaceApiProvider(collection);
}
