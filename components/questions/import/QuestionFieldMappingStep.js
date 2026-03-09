'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Button,
  Chip,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormLabel
} from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function QuestionFieldMappingStep({ previewData, onMappingComplete, onError }) {
  const { t } = useTranslation();
  const [fieldMapping, setFieldMapping] = useState({
    question: '',
    label: '',
    chunkName: '',
    context: ''
  });
  const [chunkStrategy, setChunkStrategy] = useState('virtual');
  const [availableFields, setAvailableFields] = useState([]);
  const [mappingValid, setMappingValid] = useState(false);

  const smartFieldMapping = fields => {
    const mapping = { question: '', label: '', chunkName: '', context: '' };
    const lower = fields.map(f => f.toLowerCase());

    const questionKeywords = ['question', 'query', 'prompt', 'instruction', 'input', '问题', '指令'];
    const labelKeywords = ['label', 'tag', 'tags', 'category', 'type', '标签', '类别'];
    const chunkNameKeywords = ['chunkname', 'chunk_name', 'chunk', 'source', 'filename', '文本块'];
    const contextKeywords = ['context', 'content', 'text', 'passage', 'document', '内容', '上下文'];

    fields.forEach(field => {
      const fl = field.toLowerCase();
      if (!mapping.question && questionKeywords.some(k => fl.includes(k))) {
        mapping.question = field;
      } else if (!mapping.label && labelKeywords.some(k => fl.includes(k))) {
        mapping.label = field;
      } else if (!mapping.chunkName && chunkNameKeywords.some(k => fl.includes(k))) {
        mapping.chunkName = field;
      } else if (!mapping.context && contextKeywords.some(k => fl.includes(k))) {
        mapping.context = field;
      }
    });

    return mapping;
  };

  useEffect(() => {
    if (previewData && previewData.length > 0) {
      const fields = Object.keys(previewData[0]);
      setAvailableFields(fields);
      setFieldMapping(smartFieldMapping(fields));
    }
  }, [previewData]);

  useEffect(() => {
    setMappingValid(!!fieldMapping.question);
  }, [fieldMapping]);

  const handleFieldChange = (targetField, sourceField) => {
    setFieldMapping(prev => ({ ...prev, [targetField]: sourceField }));
  };

  const handleConfirmMapping = () => {
    if (!mappingValid) {
      onError(t('questions.importMappingRequired', 'Question field is required'));
      return;
    }

    const usedFields = Object.values(fieldMapping).filter(Boolean);
    if (new Set(usedFields).size !== usedFields.length) {
      onError(t('import.duplicateMapping', 'Cannot map multiple target fields to the same source field'));
      return;
    }

    onMappingComplete(fieldMapping, chunkStrategy);
  };

  const fieldDescriptions = {
    question: t('questions.importQuestionDesc', 'Question text (required)'),
    label: t('questions.importLabelDesc', 'Question category/label (optional)'),
    chunkName: t('questions.importChunkNameDesc', 'Chunk name for matching (optional)'),
    context: t('questions.importContextDesc', 'Text context for new chunk creation (optional)')
  };

  const isRequired = field => field === 'question';

  if (!previewData || previewData.length === 0) {
    return <Alert severity="error">{t('import.noPreviewData', 'No preview data')}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {t('import.fieldMapping', 'Field Mapping')}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('import.mappingDescription', 'Map source data fields to target fields. The system has auto-detected possible mappings.')}
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          {t('import.selectMapping', 'Select Field Mapping')}
        </Typography>

        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {Object.keys(fieldMapping).map(targetField => (
            <FormControl key={targetField} fullWidth>
              <InputLabel>
                {t(`questions.importField_${targetField}`, targetField)}
                {isRequired(targetField) && <span style={{ color: 'red' }}> *</span>}
              </InputLabel>
              <Select
                value={fieldMapping[targetField]}
                label={t(`questions.importField_${targetField}`, targetField)}
                onChange={e => handleFieldChange(targetField, e.target.value)}
              >
                <MenuItem value="">
                  <em>{t('import.selectField', 'Select field')}</em>
                </MenuItem>
                {availableFields.map(field => (
                  <MenuItem key={field} value={field}>
                    {field}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {fieldDescriptions[targetField]}
              </Typography>
            </FormControl>
          ))}
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl component="fieldset">
          <FormLabel component="legend">
            {t('questions.importChunkStrategy', 'Chunk Link Strategy')}
          </FormLabel>
          <RadioGroup
            value={chunkStrategy}
            onChange={e => setChunkStrategy(e.target.value)}
          >
            <FormControlLabel
              value="virtual"
              control={<Radio />}
              label={t('questions.chunkStrategyVirtual', 'Use virtual chunk (default) — all questions linked to "Imported Questions"')}
            />
            <FormControlLabel
              value="match"
              control={<Radio />}
              label={t('questions.chunkStrategyMatch', 'Match by chunk name — requires chunkName field mapping')}
            />
            <FormControlLabel
              value="create"
              control={<Radio />}
              label={t('questions.chunkStrategyCreate', 'Auto-create new chunks — requires context field mapping')}
            />
          </RadioGroup>
        </FormControl>

        {chunkStrategy === 'match' && !fieldMapping.chunkName && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {t('questions.chunkMatchWarning', 'Please map the chunkName field for chunk matching. Unmatched questions will use the virtual chunk.')}
          </Alert>
        )}
        {chunkStrategy === 'create' && !fieldMapping.context && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {t('questions.chunkCreateWarning', 'Please map the context field for chunk creation. Questions without context will use the virtual chunk.')}
          </Alert>
        )}
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1">{t('import.dataPreview', 'Data Preview')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('import.previewNote', 'Showing first 3 records, max 100 characters per field')}
          </Typography>
        </Box>

        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {availableFields.map(field => (
                  <TableCell key={field} sx={{ minWidth: 150 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2">{field}</Typography>
                      {Object.entries(fieldMapping).map(([target, source]) => {
                        if (source === field) {
                          return (
                            <Chip
                              key={target}
                              label={t(`questions.importField_${target}`, target)}
                              size="small"
                              color={isRequired(target) ? 'primary' : 'default'}
                              variant="outlined"
                            />
                          );
                        }
                        return null;
                      })}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {previewData.map((row, index) => (
                <TableRow key={index}>
                  {availableFields.map(field => (
                    <TableCell key={field}>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                        {row[field] || '-'}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={handleConfirmMapping} disabled={!mappingValid}>
          {t('import.confirmMapping', 'Confirm Mapping')}
        </Button>
      </Box>

      {!mappingValid && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {t('questions.importMappingRequired', 'Please map the question field (required)')}
        </Alert>
      )}
    </Box>
  );
}
