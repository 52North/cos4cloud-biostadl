pipeline {
  agent any
  stages {
    stage('Build Loader') {
      agent none
      
      stages {
        agent {
          docker {
            image: 'node:14-alpine'
          }
        }
        stage('Init') {
          steps {            
            dir('${WORKSPACE}/biostadl') {
              echo 'Installing node dependencies'
              sh 'npm install'
              
              echo 'cleanup'
              sh 'npm run clean'
              
            }

          }
        }
        
        stage('Build') {
          steps {            
            dir('${WORKSPACE}/biostadl') {
              echo 'Building loader'
              sh 'npm run build'
            }

          }
        }
      }
    }

  }
}
