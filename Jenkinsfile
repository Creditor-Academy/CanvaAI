pipeline {
    agent any

    environment {
        FRONTEND_DIR = "frontend"
        DEPLOY_PATH = "/var/www/CanvaAI/frontend/dist"
    }

    stages {

        stage('Install Packages') {
            steps {
                echo '''
========================================
STEP: Installing Project Dependencies
========================================
'''
                dir("${FRONTEND_DIR}") {
                    sh '''
                    npm install || {
                        echo ""
                        echo "PROBLEM"
                        echo "______________________________"
                        echo "Dependency installation failed"
                        echo "______________________________"
                        echo ""
                        echo "CHECK"
                        echo "______________________________"
                        echo "package.json / internet / npm package issue"
                        echo "______________________________"
                        exit 1
                    }
                    '''
                }
            }
        }

        stage('Build Frontend') {
            steps {
                echo '''
========================================
STEP: Building Frontend Application
========================================
'''
                dir("${FRONTEND_DIR}") {
                    sh '''
                    npm run build || {
                        echo ""
                        echo "PROBLEM"
                        echo "______________________________"
                        echo "Frontend build failed"
                        echo "______________________________"
                        echo ""
                        echo "CHECK"
                        echo "______________________________"
                        echo "React / Vite code error in frontend source files"
                        echo "______________________________"
                        exit 1
                    }
                    '''
                }
            }
        }

        stage('Deploy Files') {
            steps {
                echo '''
========================================
STEP: Deploying Build Files
========================================
'''
                dir("${FRONTEND_DIR}") {
                    sh '''
                    sudo mkdir -p ${DEPLOY_PATH}
                    sudo rsync -av --delete dist/ ${DEPLOY_PATH}/ || {
                        echo ""
                        echo "PROBLEM"
                        echo "______________________________"
                        echo "Deployment failed"
                        echo "______________________________"
                        echo ""
                        echo "CHECK"
                        echo "______________________________"
                        echo "dist folder / rsync / server path permission"
                        echo "______________________________"
                        exit 1
                    }
                    sudo chown -R www-data:www-data ${DEPLOY_PATH}
                    sudo chmod -R 755 ${DEPLOY_PATH}
                    '''
                }
            }
        }

        stage('Deployment Check') {
            steps {
                echo '''
========================================
STEP: Checking Deployment Files
========================================
'''
                sh '''
                ls -lah ${DEPLOY_PATH} || {
                    echo ""
                    echo "PROBLEM"
                    echo "______________________________"
                    echo "Deployment folder check failed"
                    echo "______________________________"
                    echo ""
                    echo "CHECK"
                    echo "______________________________"
                    echo "Deployment path not found or files missing"
                    echo "______________________________"
                    exit 1
                }
                '''
            }
        }
    }

    post {
        success {
            echo '''
========================================
STATUS: SUCCESS
========================================

RESULT
______________________________
Frontend build and deployment completed successfully
______________________________
'''
        }

        failure {
            echo '''
========================================
STATUS: FAILED
========================================

PROBLEM
______________________________
Pipeline execution failed
______________________________

CHECK
______________________________
See the failed stage above for exact issue
______________________________
'''
        }

        always {
            echo '''
========================================
PIPELINE FINISHED
========================================
'''
        }
    }
}
