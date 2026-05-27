pipeline {
    agent any

    environment {
        FRONTEND_DIR = "frontend"
        DEPLOY_PATH  = "/var/www/CanvaAI/frontend/dist"
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
                        set -e
                        npm install
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
                        set -e
                        npm run build
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
                sh '''
                    set -e

                    sudo mkdir -p "${DEPLOY_PATH}"
                    sudo chown -R jenkins:jenkins /var/www/CanvaAI/frontend
                    sudo chmod -R 755 /var/www/CanvaAI/frontend

                    sudo rm -rf "${DEPLOY_PATH:?}"/*

                    sudo cp -r frontend/dist/* "${DEPLOY_PATH}/"
                '''
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
                    set -e
                    ls -lah "${DEPLOY_PATH}"
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
