# System Patterns

## File Processing Pipeline

The `easy-dataset` application uses a pipeline pattern to process PDF files. The pipeline consists of the following stages:

1.  **PDF Processing:** The `processPdf` function in `lib/file/file-process/pdf/index.js` is responsible for sending the PDF to the `mineru-api` for processing. The `minerULocalProcessing` function in `lib/file/file-process/pdf/mineru-local.js` handles the communication with the local `mineru-api`.

2.  **Text Splitting:** The `splitProjectFile` function in `lib/file/text-splitter.js` is responsible for splitting the processed markdown file into text chunks.

3.  **Task Orchestration:** The `processFileProcessingTask` function in `lib/services/tasks/file-processing.js` orchestrates the entire file processing pipeline. It calls the PDF processor and then the text splitter.

## API Integration

The `easy-dataset` application integrates with the `mineru-api` using a simple RESTful API. The `minerULocalProcessing` function sends a POST request to the `/file_parse` endpoint of the `mineru-api` with the PDF file as a multipart/form-data attachment. The `mineru-api` returns a JSON object containing the processed markdown content.