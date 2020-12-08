pipeline {
  agent none
  stages {
    agent {
      docker {
        image 'node:14-alpine'
      }
    }
    environment {
      HOME = '.'
    }
    stage('Biostadl Data Loader') {
      stages {
        stage('Build Data Loader') {
          
          steps {            
            dir('biostadl') {
              echo 'Installing node dependencies'
              sh 'npm install'
              
              echo 'cleanup'
              sh 'npm run clean'
              
            }

          }
        }
        
        stage('Build') {

          steps {            
            dir('biostadl') {
              echo 'Building loader'
              sh 'npm run build'
            }
          }
        }
      }
    }

  }
}
