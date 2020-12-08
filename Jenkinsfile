pipeline {
  agent any
  stages {
    stage('Build Loader') {
      agent {
        docker {
          image 'node:14-alpine'
          args '-u node'
        }

      }
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
