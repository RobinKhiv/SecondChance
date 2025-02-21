import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';

export class MarketplaceStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'MarketplaceVPC', {
      maxAzs: 2
    });

    // S3 bucket for item images
    const bucket = new s3.Bucket(this, 'ItemImagesBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
        allowedOrigins: ['*'], // Restrict in production
        allowedHeaders: ['*']
      }]
    });

    // DynamoDB tables
    const itemsTable = new dynamodb.Table(this, 'ItemsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'MarketplaceCluster', {
      vpc: vpc
    });

    // Backend Service
    const backendService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'BackendService', {
      cluster: cluster,
      memoryLimitMiB: 512,
      desiredCount: 2,
      cpu: 256,
      taskImageOptions: {
        image: ecs.ContainerImage.fromAsset('../backend'),
        environment: {
          ITEMS_TABLE_NAME: itemsTable.tableName,
          USERS_TABLE_NAME: usersTable.tableName,
          S3_BUCKET_NAME: bucket.bucketName
        }
      }
    });

    // Grant permissions
    bucket.grantReadWrite(backendService.taskDefinition.taskRole);
    itemsTable.grantReadWriteData(backendService.taskDefinition.taskRole);
    usersTable.grantReadWriteData(backendService.taskDefinition.taskRole);

    // Output values
    new cdk.CfnOutput(this, 'BackendUrl', {
      value: backendService.loadBalancer.loadBalancerDnsName
    });
  }
} 