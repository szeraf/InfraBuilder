// convert json to tf
function jsonToTf(json) {
//-----------------------------------------------------------------------------
//      Define variables for the resources
//-----------------------------------------------------------------------------
    let virtual_private_cloud = {
        vpc_name: ""
    }

    let subnet = {
        subnet_name: "",
        vpc_name: ""
    }

    let route_table = {
        route_table_name: "",
        vpc_name: "",
        igw_name: "",
        subnet_name: ""
    }

    let internet_gateway = {
        vpc_name: "",
        igw_name: ""
    }

    let ec2_security_group = {
        ec2_sg_name: "",
        vpc_name: ""
    }

    let ec2_instance = {
        ec2_name: "",
        instance_type: "",
        ami_id: "",
        ec2_count: "",
        vpc_name: "",
        subnet_name: ""
    }

    let elastic_load_balancing = {
        elb_name: "",
        subnet_name: "",
        elb_sg_name: "",
        ec2_name: "" //"\${aws_instance." + shapes[mxgraph.aws3.elastic_load_balancing].ec2_ids + ".id}"
    }

    let load_balancer_security_group = {
        lb_sg_name: "",
        vpc_name: "",
        igw_name: ""
    }

//-----------------------------------------------------------------------------
//      Collect the resources
//-----------------------------------------------------------------------------
    let mxCells = json.mxGraphModel.root.object;
    let shapes = [];

    for ( var key in mxCells ) {
        if (mxCells.hasOwnProperty(key)) {
            let top = mxCells[key];
            if (top.mxCell.attributes.style != "") {
                let attributes = [];
                let temp = top.mxCell.attributes.style;
                temp = temp.substring(0, temp.length - 1);
                let toSplit = temp.split(";");
                for (let i = 0; i < toSplit.length; i++) {
                    let key_value = toSplit[i].split("=");
                    attributes[key_value[0]] = key_value[1].toString();
                }
                shapes[top.attributes.id] = attributes.shape;
            }
        }
    }

//-----------------------------------------------------------------------------
//      Define the templates
//-----------------------------------------------------------------------------

    function main(){
        return`
# Specify the provider and access details
provider "aws" {
    region = "\${var.aws_region}"
}

variable "key_name" {
    description = "Name of the SSH keypair to use in AWS."
}

variable "aws_region" {
    description = "AWS region to launch servers."
    default     = "eu-west-1"
}
`;}

    function t_vpc(vpc_name){
        return`${ vpc_name ? `
resource "aws_vpc" "${ vpc_name }" {
    cidr_block           = "10.0.0.0/16"
    enable_dns_hostnames = true

    tags {
    Name = "${ vpc_name }"
    }
}
`:``}`;}

    function t_subnet(subnet_name, vpc_name){
        return`${ subnet_name && vpc_name ? `
resource "aws_subnet" "${ subnet_name }" {
    vpc_id                  = "\${aws_vpc.${ vpc_name }.id}"
    cidr_block              = "10.0.0.0/24"
    map_public_ip_on_launch = true

    tags {
        Name = "${ subnet_name }"
    }
}
`:``}`;}

    function t_route_table(route_table_name, vpc_name, igw_name, subnet_name){
        return`${ route_table_name && vpc_name && igw_name && subnet_name ? `
resource "aws_route_table" "${ route_table_name }" {
    vpc_id = "\${aws_vpc.${ vpc_name }.id}"

    route {
        cidr_block = "0.0.0.0/0"
        gateway_id = "\${aws_internet_gateway.${ igw_name }.id}"
    }

    tags {
        Name = "${ route_table_name }"
    }
}

resource "aws_route_table_association" "a" {
    subnet_id      = "\${aws_subnet.${ subnet_name }.id}"
    route_table_id = "\${aws_route_table.${ route_table_name }.id}"
}
`:``}`;}

    function t_internet_gateway(vpc_name, igw_name){
        return`${ vpc_name && igw_name ? `
resource "aws_internet_gateway" "gw" {
    vpc_id = "\${aws_vpc.${ vpc_name }.id}"
  
    tags {
      Name = "${ igw_name }"
    }
}
`:``}`;}

    function t_ec2_security_group(ec2_sg_name, vpc_name){
        return`${ ec2_sg_name && vpc_name ? `
resource "aws_security_group" "${ ec2_sg_name }" {
    name        = "${ ec2_sg_name }"
    description = "Used in the terraform"
    vpc_id      = "\${aws_vpc.${ vpc_name }.id}"
  
    # SSH access from anywhere
    ingress {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  
    # HTTP access from anywhere
    ingress {
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  
    # outbound internet access
    egress {
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = ["0.0.0.0/0"]
    }
}
`:``}`;}

    function t_ec2_instance(ec2_name, instance_type, ami_id, ec2_count, vpc_name, subnet_name){
        return`${ ec2_name && instance_type && ami_id && ec2_count && vpc_name && subnet_name ? `
resource "aws_instance" "${ ec2_name }" {
    instance_type = "${ instance_type }"
  
    # Lookup the correct AMI based on the region
    # we specified
    ami = "${ ami_id }"
    count = ${ ec2_count }
  
    # The name of our SSH keypair you've created and downloaded
    # from the AWS console.
    #
    # https://console.aws.amazon.com/ec2/v2/home?region=eu-west-1#KeyPairs:
    #
    key_name = "\${var.key_name}"
  
    # Our Security group to allow HTTP and SSH access
    vpc_security_group_ids = ["\${aws_security_group.${ vpc_name }.id}"]
    subnet_id              = "\${aws_subnet.${ subnet_name }.id}"
  
    #Instance tags
  
    tags {
      Name = "${ ec2_name }"
    }
}
`:``}`;}

    function t_elastic_load_balancing(elb_name, subnet_name, elb_sg_name, ec2_name){
        return`${ elb_name && subnet_name && elb_sg_name && ec2_name ? `
resource "aws_elb" "${ elb_name }" {
    name = "${ elb_name }"
  
    # The same availability zone as our instance
    subnets = ["\${aws_subnet.${ subnet_name }.id}"]
  
    security_groups = ["\${aws_security_group.${ elb_sg_name }.id}"]
  
    listener {
      instance_port     = 80
      instance_protocol = "http"
      lb_port           = 80
      lb_protocol       = "http"
    }
  
    health_check {
      healthy_threshold   = 2
      unhealthy_threshold = 2
      timeout             = 3
      target              = "HTTP:80/"
      interval            = 30
    }
  
    # The instance is registered automatically
  
    instances                   = [${ ec2_name }]
    cross_zone_load_balancing   = true
    idle_timeout                = 400
    connection_draining         = true
    connection_draining_timeout = 400
}
  
resource "aws_lb_cookie_stickiness_policy" "default" {
    name                     = "lbpolicy"
    load_balancer            = "\${aws_elb.${ elb_name }.id}"
    lb_port                  = 80
    cookie_expiration_period = 600
}
`:``}`;}
  
    function t_load_balancer_security_group(lb_sg_name, vpc_name, igw_name){
        return`${ lb_sg_name && vpc_name && igw_name ? `
resource "aws_security_group" "${ lb_sg_name }" {
    name        = "${ lb_sg_name }"
    description = "Used in the terraform"
  
    vpc_id = "\${aws_vpc.${ vpc_name }.id}"
  
    # HTTP access from anywhere
    ingress {
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  
    # outbound internet access
    egress {
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = ["0.0.0.0/0"]
    }
  
    # ensure the VPC has an Internet gateway or this step will fail
    depends_on = ["aws_internet_gateway.${ igw_name }"]
}
`:``}`;}

//-----------------------------------------------------------------------------
//      builder function
//-----------------------------------------------------------------------------

    function builder(shapes, mxCells){
        // start the tf file with the general resources
        let terraform = main();
        // get the drawn elements and concatenate the appropriate resource to the tf file
        for (var key in mxCells) {
            if (mxCells.hasOwnProperty(key)) {
                // vpc
                if (shapes[mxCells[key].attributes.id] == "mxgraph.aws3.virtual_private_cloud" || shapes[mxCells[key].attributes.id] == "mxgraph.aws3.vpc") {
                    virtual_private_cloud = {
                        vpc_name: mxCells[key].attributes.name
                    }
                    terraform += t_vpc(virtual_private_cloud.vpc_name);
                }
                // subnet
                else if (shapes[mxCells[key].attributes.id] == "mxgraph.aws3.permissions") {
                    subnet = {
                        subnet_name: mxCells[key].attributes.name,
                        vpc_name: mxCells[key].attributes.vpc
                    }
                    terraform += t_subnet(subnet.subnet_name, subnet.vpc_name);
                }
                // route table
                else if (shapes[mxCells[key].attributes.id] == "mxgraph.aws3.route_table") {
                    route_table = {
                        route_table_name: mxCells[key].attributes.name,
                        vpc_name: mxCells[key].attributes.vpc,
                        igw_name: mxCells[key].attributes.internet_gateway,
                        subnet_name: mxCells[key].attributes.subnet
                    }
                    terraform += t_route_table(route_table.route_table_name, route_table.vpc_name, route_table.igw_name, route_table.subnet_name);
                }
                // igw
                else if (shapes[mxCells[key].attributes.id] == "mxgraph.aws3.internet_gateway") {
                    internet_gateway = {
                        vpc_name: mxCells[key].attributes.vpc,
                        igw_name: mxCells[key].attributes.name
                    }
                    terraform += t_internet_gateway(internet_gateway.vpc_name, internet_gateway.igw_name);
                }
                // ec2 and sg
                else if (shapes[mxCells[key].attributes.id] == "mxgraph.aws3.ec2" || shapes[mxCells[key].attributes.id] == "mxgraph.aws3.instance" || shapes[mxCells[key].attributes.id] == "mxgraph.aws3.instances" ) {
                    ec2_security_group = {
                        ec2_sg_name: mxCells[key].attributes.sg_name,
                        vpc_name: mxCells[key].attributes.vpc
                    }
                
                    ec2_instance = {
                        ec2_name: mxCells[key].attributes.name,
                        instance_type: mxCells[key].attributes.type,
                        ami_id: mxCells[key].attributes.ami,
                        ec2_count: mxCells[key].attributes.count,
                        vpc_name: mxCells[key].attributes.vpc,
                        subnet_name: mxCells[key].attributes.subnet
                    }
                    terraform += t_ec2_security_group(ec2_security_group.ec2_sg_name, ec2_security_group.vpc_name);
                    terraform += t_ec2_instance(ec2_instance.ec2_name,ec2_instance.instance_type,ec2_instance.ami_id,ec2_instance.ec2_count,ec2_instance.vpc_name,ec2_instance.subnet_name);
                }
                // elb and sg
                else if (shapes[mxCells[key].attributes.id] == "mxgraph.aws3.elastic_load_balancing") {
                    load_balancer_security_group = {
                        lb_sg_name: mxCells[key].attributes.sg_name,
                        vpc_name: mxCells[key].attributes.vpc,
                        igw_name: mxCells[key].attributes.igw_name
                    }
                    elastic_load_balancing = {
                        elb_name: mxCells[key].attributes.name,
                        subnet_name: mxCells[key].attributes.subnet,
                        elb_sg_name: mxCells[key].attributes.sg_name,
                        ec2_name: mxCells[key].attributes.ec2_ids
                    }
                    terraform += t_load_balancer_security_group(load_balancer_security_group.lb_sg_name,load_balancer_security_group.vpc_name,load_balancer_security_group.igw_name);
                    terraform += t_elastic_load_balancing(elastic_load_balancing.elb_name,elastic_load_balancing.subnet_name,elastic_load_balancing.elb_sg_name,elastic_load_balancing.ec2_name);
                }
                else {
                    continue;
                }
            }
        }
        // return the tf file
        return terraform;
    }

    return builder(shapes, mxCells);
}