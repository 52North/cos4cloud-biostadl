pipeline {
  agent any
  stages {
    stage('Build Loader') {
      agent none
      
      steps {
        echo 'Hello World'
        dir('${WORKSPACE}/biostadl') {
          nodejs('nodejs_15.3.0') {
             sh label: 'install dependencies', script: 'npm install'
             sh label: 'transpile typescript', script: 'npm run build'
          }
        }

      }
    }

  }
}
