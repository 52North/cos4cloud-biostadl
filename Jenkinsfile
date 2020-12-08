pipeline {
  agent none
  stages {

    stage('Data Loader') {
      agent {
        docker {
          image 'node:14-alpine'
        }

      }
      stages {
        stage('Init') {
          steps {
            sh 'npm install'
          }
        }
        
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


      }
    }

  }
  environment {
    HOME = '.'
  }
}
