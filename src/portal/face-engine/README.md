# Face Engine (`src/portal/face-engine`)

## Overview
Pluggable facial detection, 512-D ArcFace embedding calculation, local subject collection storage, and remote CompreFace provider integration.

## Interface
- `index.ts:createFaceEngine` — Factory returning `IFaceEngineProvider`.
- `types.ts:BoundingBox`, `Point2D`, `FaceLandmarks5`, `HeadPoseAngles`, `FaceDetectionResult`, `SubjectExample`, `Subject`, `RecognitionPrediction`, `RecognitionOptions`, `VerificationResult`, `IFaceDetector`, `IEmbeddingCalculator`, `IFaceCollection`, `IFaceEngineProvider`
- `LocalFaceCollection.ts:LocalFaceCollection`
- `ArcFace512EmbeddingCalculator.ts:ArcFace512EmbeddingCalculator`, `arcFace512`, `normalizeL2`, `computeCosineSimilarity512`
- `LegacyFaceApiProvider.ts:LegacyFaceApiProvider`
- `RemoteCompreFaceProvider.ts:RemoteCompreFaceConfig`, `RemoteCompreFaceProvider`

## Invariants
- `[index.ts:createFaceEngine]` Defaults to `LegacyFaceApiProvider` unless `providerType === 'remote'` and both `remoteConfig.baseUrl` and `remoteConfig.apiKey` are truthy.
- `[ArcFace512EmbeddingCalculator.ts:ArcFace512EmbeddingCalculator]` Outputs 512-dimensional L2-normalized embeddings; falls back to deterministic 512-D projection if ONNX session is unavailable or inference fails.
- `[ArcFace512EmbeddingCalculator.ts:computeCosineSimilarity512]` Returns `0` if vector lengths differ or are `0`, otherwise clamps dot product to `[0, 1]`.
- `[LegacyFaceApiProvider.ts:LegacyFaceApiProvider]` Maps Euclidean distance to similarity via `clamp(1 - dist^2 / 2, 0, 1)`; `verify()` sets `match = sim >= 0.85`.
- `[RemoteCompreFaceProvider.ts:RemoteCompreFaceProvider]` `isReady()` requires non-empty `baseUrl` and `apiKey`; `verify()` sets `match = similarity >= 0.85` and derives distance via `sqrt(2 * (1 - similarity))`.

## Side Effects
- `[LocalFaceCollection.ts:LocalFaceCollection]` Reads and writes JSON-serialized subject collections to browser `localStorage` under `storageKey` (default `'pk_compreface_collection'`).
- `[ArcFace512EmbeddingCalculator.ts:ArcFace512EmbeddingCalculator]` Mutates global `onnxruntime-web` `ort.env.wasm` settings (`wasmPaths`, `numThreads`, `simd`), loads ONNX model from `modelPath`, creates offscreen `HTMLCanvasElement` for preprocessing, and logs to `console`.
- `[LegacyFaceApiProvider.ts:LegacyFaceApiProvider]` Loads `face-api` neural network weights from `'/models'` via network fetch during `initialize()`.
- `[RemoteCompreFaceProvider.ts:RemoteCompreFaceProvider]` Performs HTTP `fetch` requests (`GET /api/v1/recognition/subjects`, `POST /api/v1/detection/detect`, `POST /api/v1/recognition/recognize`, `POST /api/v1/recognition/faces/{id}/verify`) with `'x-api-key'` header, creates offscreen `HTMLCanvasElement` for video frames, and logs warnings to `console`.

## Verification
- Run: `npm run lint && npm run build`
