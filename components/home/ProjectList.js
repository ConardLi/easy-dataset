'use client';

import { Grid, Card, Box, CardActionArea, CardContent, Typography, Avatar, Chip, Divider, Paper, Button, useTheme, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import Link from 'next/link';
import { styles } from '@/styles/home';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DataObjectIcon from '@mui/icons-material/DataObject';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export default function ProjectList({ projects, onCreateProject }) {
    const { t } = useTranslation();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [loading, setLoading] = useState(false);

    // 打开删除确认对话框
    const handleOpenDeleteDialog = (event, project) => {
        event.stopPropagation();
        event.preventDefault();
        setProjectToDelete(project);
        setDeleteDialogOpen(true);
    };

    // 关闭删除确认对话框
    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setProjectToDelete(null);
    };

    // 删除项目
    const handleDeleteProject = async () => {
        if (!projectToDelete) return;

        try {
            setLoading(true);
            const response = await fetch(`/api/projects/${projectToDelete.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || t('projects.deleteFailed'));
            }

            // 刷新页面以更新项目列表
            window.location.reload();
        } catch (error) {
            console.error('删除项目失败:', error);
            alert(error.message || t('projects.deleteFailed'));
        } finally {
            setLoading(false);
            handleCloseDeleteDialog();
        }
    };

    return (
        <>
            <Grid container spacing={3}>
                {projects.length === 0 ? (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                {t('projects.noProjects')}
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={onCreateProject}
                                startIcon={<AddCircleOutlineIcon />}
                                sx={{ mt: 2 }}
                            >
                                {t('projects.createFirst')}
                            </Button>
                        </Paper>
                    </Grid>
                ) : (
                    projects.map((project) => (
                        <Grid item xs={12} sm={6} md={4} key={project.id}>
                            <Card sx={styles.projectCard}>
                                <Box sx={styles.projectAvatar}>
                                    <Avatar
                                        sx={{
                                            bgcolor: 'primary.main',
                                            width: 48,
                                            height: 48,
                                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        <DataObjectIcon />
                                    </Avatar>
                                </Box>
                                <CardActionArea
                                    component={Link}
                                    href={`/projects/${project.id}`}
                                    sx={{
                                        flexGrow: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        justifyContent: 'flex-start',
                                        pt: 4
                                    }}
                                >
                                    <CardContent sx={{ width: '100%', pb: 1 }}>
                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            mb: 0.5
                                        }}>
                                            <Typography variant="h5" component="div" fontWeight="600" sx={{ mt: 1 }}>
                                                {project.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Chip
                                                    size="small"
                                                    label={`${project.questionsCount || 0} ${t('projects.questions')}`}
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    size="small"
                                                    label={`${project.datasetsCount || 0} ${t('projects.datasets')}`}
                                                    color="secondary"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        </Box>

                                        <Typography variant="body2" color="text.secondary" sx={styles.projectDescription}>
                                            {project.description}
                                        </Typography>

                                        <Divider sx={{ mb: 2 }} />

                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <Typography variant="caption" color="text.secondary">
                                                {t('projects.lastUpdated')}: {project.lastUpdated}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Typography variant="body2" color="primary" sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5
                                                }}>
                                                    {t('projects.viewDetails')}
                                                    <ArrowForwardIcon fontSize="small" sx={{ fontSize: '16px' }} />
                                                </Typography>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={(e) => handleOpenDeleteDialog(e, project)}
                                                    sx={{ ml: 1 }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))
                )}
            </Grid>

            {/* 删除确认对话框 */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCloseDeleteDialog}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title">
                    {t('projects.deleteConfirmTitle')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description">
                        {projectToDelete && (
                            <>
                                {t('projects.deleteConfirm')}
                                <br />
                                <Typography component="span" fontWeight="bold" sx={{ mt: 1, display: 'inline-block' }}>
                                    {projectToDelete.name}
                                </Typography>
                            </>
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog} disabled={loading}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleDeleteProject} color="error" variant="contained" disabled={loading}>
                        {loading ? t('common.deleting') : t('common.delete')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}