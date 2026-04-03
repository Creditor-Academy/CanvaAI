pipeline {
    agent any

    environment {
        FRONTEND_DIR = "frontend"
        DEPLOY_PATH = "/var/www/canvaai"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/Creditor-Academy/CanvaAI.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm install'
                }
            }
        }

        stage('Build') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm run build'
                }
            }
        }

        stage('Deploy') {
            steps {
                dir("${FRONTEND_DIR}") {
                    sh '''
                    sudo rm -rf ${DEPLOY_PATH}/*
                    sudo cp -r dist/* ${DEPLOY_PATH}/
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "🔥 Deployment Successful"
        }
        failure {
            echo "❌ Build Failed"
        }
    }
}
