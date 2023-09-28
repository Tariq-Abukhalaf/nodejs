const { EC2Client, DescribeInstancesCommand, DescribeImagesCommand, RunInstancesCommand, CreateTagsCommand, TerminateInstancesCommand } = require("@aws-sdk/client-ec2");
require('dotenv').config();

class server 
{
    constructor(region) {
        this.region     = region;
        this.access_key = process.env.AWS_ACCESS_KEY;
        this.secret_key = process.env.AWS_SECRET_KEY;
        this.ec2Client  = new EC2Client({ 
            region: this.region,
            credentials: {
                accessKeyId: this.access_key,
                secretAccessKey: this.secret_key,
            },
        });
    }
  
    async listSlaveInstances() 
    {
        const params = {
            Filters: [
                {
                    Name: 'tag:Name',
                    Values: ['slave'],
                },
            ],
        };
        try {
            const data = await this.ec2Client.send(new DescribeInstancesCommand(params));
            const instances = [];
            for (const reservation of data.Reservations) {
                for (const instance of reservation.Instances) {
                    instances.push({
                        ImageId           : instance.ImageId,
                        InstanceId        : instance.InstanceId,
                        InstanceType      : instance.InstanceType,
                        State             : instance.State.Name,
                        PrivateIpAddress  : instance.PrivateIpAddress,
                        PublicIpAddress   : instance.PublicIpAddress,
                        PlatformDetails   : instance.PlatformDetails
                    });
                }
            }
            return instances;
        } catch (err) {
            console.error('Error listing EC2 instances:', err);
        } finally {
            this.ec2Client.destroy();
        }
    }

    async listRunningSlaveInstances() 
    {
        const params = {
            Filters: [
                {
                    Name: 'instance-state-name',
                    Values: ['running'],
                },
                {
                    Name: 'tag:Name',
                    Values: ['slave'],
                },
            ],
        };
        try {
            const data = await this.ec2Client.send(new DescribeInstancesCommand(params));
            const instances = data.Reservations.map((reservation) =>
                reservation.Instances.map((instance) => ({
                    InstanceId: instance.InstanceId,
                    State: instance.State.Name,
            }))).flat();
            return instances;

        } catch (error) {
            console.error('Error listing instances:', error);
            return [];
        }
    }

    async listTerminatedInstances() 
    {
        const params = {
            Filters: [
                {
                    Name: 'instance-state-name',
                    Values: ['terminated'],
                }
            ],
        };
        try {
            const data = await this.ec2Client.send(new DescribeInstancesCommand(params));
            const instances = data.Reservations.map((reservation) =>
                reservation.Instances.map((instance) => ({
                    InstanceId: instance.InstanceId,
                    State: instance.State.Name,
            }))).flat();
            return instances;

        } catch (error) {
            console.error('Error listing instances:', error);
            return [];
        }
    }

    async terminateRandomInstance() 
    {
        const instances = await this.listRunningSlaveInstances();
        if (instances.length === 0) {
            return;
        }
        const randomIndex = Math.floor(Math.random() * instances.length);
        const instanceToTerminate = instances[randomIndex].InstanceId;
        const terminateParams = {
            InstanceIds: [instanceToTerminate],
        };
        try {
            const terminateInstancesCommand = new TerminateInstancesCommand(terminateParams);
            await this.ec2Client.send(terminateInstancesCommand);
            console.log(`Instance terminated: ${instanceToTerminate}`);
        } catch (error) {
            console.error(`Error terminating instance ${instanceToTerminate}:`, error);
        }
    }

    async launchNewInstance(instanceName,instanceType,imageId)
    {
        const params = {
            ImageId: imageId,
            InstanceType: instanceType,
            MinCount: 1,
            MaxCount: 1,
            Architecture: "arm64", // Set the architecture to "arm64" for ARM-based instances
        };
        try {
            const command = new RunInstancesCommand(params);
            const result = await this.ec2Client.send(command);
            const instanceId = result.Instances[0].InstanceId;
            await this.tagInstance(instanceId, instanceName);
            console.log('New instance launched:', result.Instances[0].InstanceId);
        } catch (error) {
            console.error('Error launching instance:', error);
        }
    }

    async tagInstance(instanceId, name) 
    {
        const tagParams = {
            Resources: [instanceId],
            Tags: [
                {
                    Key: 'Name',
                    Value: name,
                },
            ],
        };
        try {
            const createTagsCommand = new CreateTagsCommand(tagParams);
            await this.ec2Client.send(createTagsCommand);
        } catch (error) {
            console.error('Error adding name tag to instance:', error);
        }
    }

    async getLatestUbuntuAmi()
    {
        const ubuntuAmiFilter = {
            Filters: [
                {
                  Name: 'name',
                  Values: ['ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*'],
                },
                {
                  Name: 'state',
                  Values: ['available'],
                },
                {
                  Name: 'virtualization-type',
                  Values: ['hvm'],
                },
                {
                  Name: 'architecture',
                  Values: ['x86_64'],
                },
                {
                  Name: 'root-device-type',
                  Values: ['ebs'],
                },
            ],
        };
        try {
            const describeImagesCommand = new DescribeImagesCommand(ubuntuAmiFilter);
            const response = await this.ec2Client.send(describeImagesCommand);
            if (response.Images.length > 0) 
            {
                const sortedImages = response.Images.sort((a, b) => {
                    return new Date(b.CreationDate) - new Date(a.CreationDate);
                });
                const latestAmiId = sortedImages[0].ImageId;
                return latestAmiId;
            } 
        } catch (error) {
            console.error('Error fetching Ubuntu AMI:', error);
        }
    }

}

module.exports = server;