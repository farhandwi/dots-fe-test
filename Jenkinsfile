pipeline {
  agent {
    kubernetes {
      yaml '''
apiVersion: v1
kind: Pod
spec:
  securityContext:
    runAsUser: 0
    runAsGroup: 0
    fsGroup: 0
  containers:
  - name: gcloud-kubectl
    image: google/cloud-sdk:latest
    command:
    - sleep
    args:
    - 99999
    securityContext:
      runAsUser: 0
    resources:
      requests:
        memory: "256Mi"
        cpu: "256m"
      limits:
        memory: "512Mi"
        cpu: "512m"
  - name: nodejs
    image: node:18-alpine
    command:
    - sleep
    args:
    - 99999
    securityContext:
      runAsUser: 0
    resources:
      requests:
        memory: "1Gi"
        cpu: "512m"
      limits:
        memory: "3Gi"
        cpu: "1500m"
    env:
    - name: NODE_ENV
      value: "test"
    - name: CI
      value: "true"
    - name: NEXT_TELEMETRY_DISABLED
      value: "1"
    - name: NODE_OPTIONS
      value: "--max-old-space-size=2048"
  - name: kaniko
    image: gcr.io/kaniko-project/executor:v1.9.0-debug
    command:
    - sleep
    args:
    - 99999
    securityContext:
      runAsUser: 0
    volumeMounts:
    - name: kaniko-secret
      mountPath: /kaniko/.docker
  volumes:
  - name: kaniko-secret
    secret:
      secretName: jenkins-sa-new-1
      items:
      - key: config.json
        path: config.json
'''
    }
  }
  
  environment {
    PROJECT_ID = 'dots-production-farhan01'
    CLUSTER_NAME = 'dots-gke-cluster'
    CLUSTER_ZONE = 'asia-southeast2-a'
    REGISTRY = 'gcr.io'
    IMAGE_NAME = 'dots-fe-node'
    IMAGE_TAG = "${BUILD_NUMBER}"
    DEPLOYMENT_TIMEOUT = '900s'
    
    // Testing Configuration
    NODE_ENV = 'test'
    CI = 'true'
    NEXT_TELEMETRY_DISABLED = '1'
    NODE_OPTIONS = '--max-old-space-size=2048'
    
    // SonarQube Configuration
    SONAR_HOST_URL = 'http://sonarqube.devops-tools.svc.cluster.local:9000'
    SONAR_PROJECT_KEY = 'dots-fe-node'
    SONAR_PROJECT_NAME = 'dots-fe-node'
    SONAR_PROJECT_VERSION = "${BUILD_NUMBER}"
  }
  
  stages {
    stage('Checkout') {
      steps {
        script {
          try {
            // Clean workspace safely
            cleanWs()
            checkout scm
            
            // Verify source code
            sh '''
              echo "=== Source Code Verification ==="
              ls -la
              echo "Checking critical files..."
              [ -f package.json ] && echo "✓ package.json found" || echo "✗ package.json missing"
              [ -f Dockerfile ] && echo "✓ Dockerfile found" || echo "✗ Dockerfile missing"
              [ -f next.config.mjs ] && echo "✓ next.config.mjs found" || echo "✗ next.config.mjs missing"
            '''
            
            // Stash source code with better exclusions
            stash includes: '**', excludes: 'node_modules/**,.git/**,coverage/**,.next/**,*.log,build-artifacts.tar.gz', name: 'source', useDefaultExcludes: true
            echo "✓ Source code stashed successfully"
            
          } catch (Exception e) {
            echo "❌ Checkout failed: ${e.getMessage()}"
            throw e
          }
        }
      }
    }
    
    stage('Dependency Installation') {
      steps {
        container('nodejs') {
          script {
            unstash 'source'
            
            sh '''
              echo "=== Installing Dependencies ==="
              
              # Clean any existing modules
              rm -rf node_modules package-lock.json yarn.lock
              
              # Configure npm for better performance
              npm config set prefer-offline true
              npm config set audit false
              npm config set fund false
              npm config set progress false
              
              # Install dependencies with timeout
              timeout 600 npm install --prefer-offline --no-audit --no-fund --silent || {
                echo "npm install failed, trying npm install..."
                timeout 600 npm install --prefer-offline --no-audit --no-fund --silent
              }
              
              echo "✓ Dependencies installed successfully"
              echo "Node modules size: $(du -sh node_modules 2>/dev/null || echo 'N/A')"
            '''
            
            // Stash node_modules separately to reuse
            stash includes: 'node_modules/**', name: 'node_modules', useDefaultExcludes: false
          }
        }
      }
    }
    
    stage('Tests & Static Analysis') {
      parallel {
        stage('Static Code Analysis (SonarQube)') {
          steps {
            script {
              unstash 'source'
              def scannerHome = tool 'sq1'
              withSonarQubeEnv('sq1') {
                sh """
                  ${scannerHome}/bin/sonar-scanner \
                    -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                    -Dsonar.projectName=${SONAR_PROJECT_NAME} \
                    -Dsonar.projectVersion=${SONAR_PROJECT_VERSION} \
                    -Dsonar.sources=. \
                    -Dsonar.exclusions=node_modules/**,coverage/**,.next/** \
                    -Dsonar.host.url=${SONAR_HOST_URL}
                """
              }
            }
          }
        }
    
        stage('Unit Tests') {
          steps {
            container('nodejs') {
              script {
                try {
                  unstash 'source'
                  unstash 'node_modules'
                  
                  timeout(time: 10, unit: 'MINUTES') {
                    sh '''
                      echo "=== Running Unit Tests ==="
                      
                      # Verify package.json test configuration
                      echo "Checking package.json for test scripts..."
                      if [ -f package.json ]; then
                        echo "Test scripts found:"
                        cat package.json | jq -r '.scripts | to_entries[] | select(.key | contains("test")) | "\\(.key): \\(.value)"' 2>/dev/null || \
                        grep -A 5 -B 5 '"test"' package.json || echo "No test scripts found in package.json"
                      fi
                      
                      # Check for Jest configuration
                      echo "Looking for Jest configuration..."
                      for config in jest.config.ts jest.config.mjs jest.config.json package.json; do
                        if [ -f "$config" ]; then
                          echo "Found Jest config in: $config"
                          if [ "$config" = "package.json" ]; then
                            grep -A 10 '"jest"' package.json || echo "No Jest config in package.json"
                          fi
                        fi
                      done
                      
                      # Set test environment variables
                      export NODE_ENV=test
                      export CI=true
                      export NEXT_TELEMETRY_DISABLED=1
                      export FORCE_COLOR=0
                      export NODE_OPTIONS="--max-old-space-size=2048"
                      
                      # Disable Next.js telemetry
                      ./node_modules/.bin/next telemetry disable 2>/dev/null || true
                      
                      echo "=== Environment Check ==="
                      echo "Node version: $(node --version)"
                      echo "NPM version: $(npm --version)"
                      echo "Working directory: $(pwd)"
                      echo "NODE_ENV: $NODE_ENV"
                      echo "CI: $CI"
                      
                      # Try different test commands with timeouts
                      if npm run | grep -q "test:ci"; then
                        echo "Running npm run test:ci..."
                        timeout 480 npm run test:ci 
                      elif npm run | grep -q "test"; then
                        echo "Running npm run test..."
                        timeout 480 npm run test
                      else
                        echo "No test script found, running Jest directly..."
                        timeout 480 ./node_modules/.bin/jest --ci --verbose --no-coverage --maxWorkers=1 --forceExit --detectOpenHandles --passWithNoTests
                      fi
                      
                      echo "✓ Tests completed successfully"
                    '''
                  }
                  
                } catch (Exception e) {
                  echo "⚠️ Tests failed or timed out: ${e.getMessage()}"
                  
                  // Show debugging info
                  sh '''
                    echo "=== Test Failure Debug Info ==="
                    echo "Process list:"
                    ps aux | grep -E "(node|jest|npm)" | grep -v grep || echo "No related processes found"
                    echo "Memory usage:"
                    free -h || echo "Memory info not available"
                    echo "Disk usage:"
                    df -h || echo "Disk info not available"
                  '''
                  
                  // Don't fail pipeline for non-production branches
                  if (env.BRANCH_NAME != 'main' && env.BRANCH_NAME != 'master') {
                    echo "Non-production branch, marking as unstable..."
                    currentBuild.result = 'UNSTABLE'
                  } else {
                    echo "Production branch, test failures are critical!"
                    throw e
                  }
                }
              }
            }
          }
        }
      }
    }
    
    stage('Build & Push Docker Image') {
      steps {
        container('kaniko') {
          script {
            try {
              // Get build artifacts from archive
              sh '''
                echo "Verifying build context..."
                ls -la
                [ -f Dockerfile ] && echo "✓ Dockerfile found" || echo "✗ Dockerfile missing"
                [ -f package.json ] && echo "✓ package.json found" || echo "✗ package.json missing"
                [ -d .next ] && echo "✓ .next directory found" || echo "✗ .next directory missing"
              '''
              
              sh """
                echo "=== Building Docker Image ==="
                echo "Image will be tagged as: ${REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG}"
                echo "Also tagged as: ${REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:latest"
                
                echo "Starting Kaniko build..."
                /kaniko/executor \
                  --dockerfile=Dockerfile \
                  --context=. \
                  --destination=${REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG} \
                  --destination=${REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:latest \
                  --cache=true \
                  --cache-repo=${REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}/cache \
                  --snapshotMode=redo \
                  --use-new-run \
                  --log-format=text \
                  --log-timestamp=true \
                  --verbosity=info \
                  --skip-tls-verify-registry=${REGISTRY}
                  
                echo "=== Docker Build Completed Successfully ==="
              """
              
            } catch (Exception e) {
              echo "❌ Docker build failed: ${e.getMessage()}"
              sh '''
                echo "=== Docker Build Debug Info ==="
                ls -la
                echo "Dockerfile content:"
                cat Dockerfile || echo "No Dockerfile found"
              '''
              throw e
            }
          }
        }
      }
    }
    
    stage('Pre-Deployment Check') {
      steps {
        container('gcloud-kubectl') {
          withCredentials([file(credentialsId: 'gcp-service-account', variable: 'GC_KEY')]) {
            script {
              try {
                sh '''
                  echo "=== Pre-Deployment Verification ==="
                  gcloud auth activate-service-account --key-file="${GC_KEY}"
                  gcloud container clusters get-credentials ${CLUSTER_NAME} --zone ${CLUSTER_ZONE} --project ${PROJECT_ID}
                  
                  echo "Checking cluster status..."
                  kubectl get nodes
                  
                  echo "Verifying image in registry..."
                  gcloud container images list --repository=${REGISTRY}/${PROJECT_ID} --filter="name~${IMAGE_NAME}" || echo "Image list failed"
                  
                  echo "Checking specific image tag..."
                  gcloud container images describe ${REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG} || echo "New image, will be available after build"
                  
                  echo "Checking current deployment..."
                  kubectl get deployment dots-fe-node -n default || echo "Deployment not found - will be created"
                  
                  echo "Checking service..."
                  kubectl get service dots-fe-node-service -n default || echo "Service not found"
                '''
                
              } catch (Exception e) {
                echo "⚠️ Pre-deployment check had issues: ${e.getMessage()}"
                echo "Continuing with deployment..."
              }
            }
          }
        }
      }
    }
    
    stage('Deploy to GKE') {
      steps {
        container('gcloud-kubectl') {
          withCredentials([file(credentialsId: 'gcp-service-account', variable: 'GC_KEY')]) {
            script {
              try {
                sh """
                  echo "=== Deploying to GKE ==="
                  gcloud auth activate-service-account --key-file="\${GC_KEY}"
                  gcloud container clusters get-credentials ${CLUSTER_NAME} --zone ${CLUSTER_ZONE} --project ${PROJECT_ID}
                  
                  echo "Updating deployment with new image..."
                  kubectl set image deployment/dots-fe-node dots-fe-node=${REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG} -n default
                  
                  echo "Waiting for deployment to complete..."
                  kubectl rollout status deployment/dots-fe-node --timeout=${DEPLOYMENT_TIMEOUT} -n default
                  
                  echo "✓ Deployment completed successfully!"
                """
                
              } catch (Exception e) {
                echo "❌ Deployment failed: ${e.getMessage()}"
                throw e
              }
            }
          }
        }
      }
    }
    
    stage('Post-Deployment Verification') {
      steps {
        container('gcloud-kubectl') {
          withCredentials([file(credentialsId: 'gcp-service-account', variable: 'GC_KEY')]) {
            script {
              try {
                sh '''
                  echo "=== Post-Deployment Verification ==="
                  gcloud auth activate-service-account --key-file="${GC_KEY}"
                  gcloud container clusters get-credentials ${CLUSTER_NAME} --zone ${CLUSTER_ZONE} --project ${PROJECT_ID}
                  
                  echo "Deployment status:"
                  kubectl get deployment dots-fe-node -n default
                  
                  echo "Pod status:"
                  kubectl get pods -n default -l app=dots-fe-node -o wide
                  
                  echo "Service status:"
                  kubectl get service dots-fe-node-service -n default
                  
                  echo "Waiting for pods to be ready..."
                  sleep 30
                  
                  echo "Testing health check endpoint..."
                  kubectl run test-health-${BUILD_NUMBER} --image=curlimages/curl:latest --rm -i --restart=Never --timeout=60s -- \
                    curl -f http://dots-fe-node-service.default.svc.cluster.local:3000/api/health || echo "Health check failed, but continuing..."
                  
                  echo "Recent events:"
                  kubectl get events -n default --sort-by='.lastTimestamp' --field-selector involvedObject.name=dots-fe-node | head -10
                  
                  echo "✓ Post-deployment verification completed"
                '''
                
              } catch (Exception e) {
                echo "⚠️ Post-deployment verification had issues: ${e.getMessage()}"
                echo "But deployment may still be successful"
              }
            }
          }
        }
      }
    }
  }
  
  post {
    always {
      echo "=== Pipeline Completed ==="
      
      // Enhanced cleanup
      script {
        try {
          // Remove build artifacts
          sh 'rm -f build-artifacts.tar.gz || true'
          
          // Simple cleanup
          cleanWs(
            cleanWhenNotBuilt: false,
            deleteDirs: true,
            disableDeferredWipeout: true,
            notFailBuild: true,
            patterns: [
              [pattern: '.gitignore', type: 'INCLUDE'],
              [pattern: '.propsfile', type: 'EXCLUDE'],
              [pattern: 'node_modules/**', type: 'EXCLUDE']
            ]
          )
        } catch (Exception e) {
          echo "⚠️ Cleanup had issues: ${e.getMessage()}"
        }
      }
    }
    
    success {
      echo "✅ Deployment successful!"
      echo "🐳 Image: ${REGISTRY}/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG}"
      echo "🔗 Application should be available at your configured endpoint"
      echo "📊 Build Number: ${BUILD_NUMBER}"
    }
    
    failure {
      echo '❌ Pipeline failed!'
      
      // Enhanced failure diagnostics
      container('gcloud-kubectl') {
        withCredentials([file(credentialsId: 'gcp-service-account', variable: 'GC_KEY')]) {
          script {
            try {
              sh '''
                echo "=== FAILURE DIAGNOSTICS ==="
                gcloud auth activate-service-account --key-file="${GC_KEY}"
                gcloud container clusters get-credentials ${CLUSTER_NAME} --zone ${CLUSTER_ZONE} --project ${PROJECT_ID}
                
                echo "Recent events:"
                kubectl get events -n default --sort-by='.lastTimestamp' | grep -i dots-fe-node | head -20 || true
                
                echo "Pod status:"
                kubectl get pods -n default -l app=dots-fe-node -o wide || true
                
                echo "Pod logs:"
                kubectl logs -l app=dots-fe-node -n default --tail=100 || true
                
                echo "Deployment status:"
                kubectl describe deployment dots-fe-node -n default || true
                
                echo "Image in registry:"
                gcloud container images list --repository=${REGISTRY}/${PROJECT_ID} --filter="name~${IMAGE_NAME}" || true
              '''
            } catch (Exception e) {
              echo "Could not retrieve diagnostics: ${e.getMessage()}"
            }
          }
        }
      }
    }
  }
}
