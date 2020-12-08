pipeline {
  agent none
  stages {
    stage('Data Loader') {
      agent {
        docker {
          image 'node:14-alpine'
        }

      }
      steps {
        echo 'Data Loader'
      }
    }

    stage('Cleanup') {
      parallel {
        stage('Cleanup') {
          steps {
            echo 'Clean up'
            dir(path: 'biostadl') {
              sh 'npm run clean'
            }

          }
        }

        stage('Build') {
          steps {
            echo 'Build'
            sh 'npm run build'
          }
        }

        stage('Init') {
          steps {
            sh 'npm install'
          }
        }

      }
    }

  }
  environment {
    HOME = '.'
  }
}