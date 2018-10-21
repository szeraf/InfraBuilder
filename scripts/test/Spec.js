describe('Testing the functionality', ()=>{
    var equalityChecker = function(generated, expected){
        if (typeof generated == "string" && typeof expected == "string") {
            return generated.replace(/\s/g,'') == expected.replace(/\s/g,'');
        }
    }

    beforeEach(function() {
        jasmine.addCustomEqualityTester(equalityChecker);
    });

    it('convert a valid XML', ()=>{
      let payload = '<?xml version="1.0" encoding="UTF-8"?> <mxfile userAgent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.67 Safari/537.36" version="9.2.9" editor="www.draw.io"><diagram id="14058d99-db58-e9f5-3aba-399879c13e25" name="Page-1">1Vhtb9owEP41fFyV2ATCx5bRbVInVZq0fUROYoI7J0a2U2C/fnZ8zgsJfVE7dSAk4vPZvnvuufOFCV4Why+S7LbfRUb5BAXZYYI/TxAKcTg3P1ZydJIoWDhBLlkGSq3gB/tDQRiAtGIZVT1FLQTXbNcXpqIsaap7MiKl2PfVNoL3T92RnA4EP1LCh9JfLNNbJ43RrJV/pSzf+pPDGfiXkPR3LkVVwnkThDf1x00XxO8FjqotycS+I8KrCV5KIbR7Kg5Lyi22Hja37vbMbGO3pKV+yQIcwhKlj955mhksYCik3opclISvWulN7SC1WwRmtNUFN4+heXygWh8hnKTSwojaHe6E2IHe0ExvhqhkCnbgAFikicyp9gYDctbKzlJw7wsVBdXyaBQk5USzx35ECRAjb/RacMwD4FMPRfJgqYUCThLK3bLV0m7CSqVJacystyxJAWfsaaKofKQSfMnXnTn1SeVO/rhLnSyjG1JxvbYCt6JKSu+on1Slp3rlsULgS8HcmH0KMZqG5gt4HXdwqkZXBSuZEzcxd7j2CdGJv6g0ZyVdNrllg5wRtW0iblzUzGTLnUXmXiimmSjNXCK0FkVH4Zqz3E5oG/kbAqPURN2A1GOOSYTa6OKQ25JyRfYKX9HUmHmzYZwvBReyNg/fRnGEp0ZuFDNmtvJzpSjpU9yyRtHDk5yBWTzFV5FbBAUMz4F2+7YczIGe204liPGreWaGQLWztPtm8bLMMJWRaLonx1PqebawfP8cyVoaLC6EBgzcX3vnP4ITUYR6jAjjhedIhxP+HuhyYo7+BSdWnCgDrhHeCZKZH4OrKUqsNFVmxs3Cm8TUoVmuG/eHbKE8OVN4NBTZFK1ZpsbLTK++ZWRD7ZZ+x4Z/QLp831E+IWIYXAgRqcN8zQ3i66TB+2NK1LRPx/liWKBmnqFdOi7eXKJGugj8/3YRIRrpInw/+s+7iBGspheG1ft3XPXSayntPdYo7ISp86qz870VdApwPOtfyfiktT3VD4I36SPo9tu4OovbKDeuvzDw0YUF3vffHxz4aTw76cam8NZyLpRjK9Bbgjl2Af+8X567V4e9ljv+Aq64+t7+mPbqBS33bD52o8WvL8vP32hQbB4Jr3pdSydqbW5aOIlMIR3DQfSUluI37SAa1J8TpAHNMyC7PfzfEeh9YEfxKexhNIQd+dLYRR3HwathH8sj6D3PpJJ//X3B+0z49GttLyDPpcGOyoIpZXJMDdPh8+J6Pg3PR6p30nsEaT4IEkYjLx94LErRW3PDDNv/o1ypbP/0w6u/</diagram></mxfile>';
      let expected = `
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

resource "aws_security_group" "ws-sg" {
    name        = "ws-sg"
    description = "Used in the terraform"
    vpc_id      = "\${aws_vpc.default_vpc.id}"
    
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

resource "aws_instance" "webserver" {
    instance_type = "t2.mini"
    
    # Lookup the correct AMI based on the region
    # we specified
    ami = "i-13241241"
    count = 2
    
    # The name of our SSH keypair you've created and downloaded
    # from the AWS console.
    #
    # https://console.aws.amazon.com/ec2/v2/home?region=eu-west-1#KeyPairs:
    #
    key_name = "\${var.key_name}"
    
    # Our Security group to allow HTTP and SSH access
    vpc_security_group_ids = ["\${aws_security_group.default_vpc.id}"]
    subnet_id              = "\${aws_subnet.default_sn.id}"
    
    #Instance tags
    
    tags {
        Name = "webserver"
    }
}

resource "aws_internet_gateway" "gw" {
    vpc_id = "\${aws_vpc.default_vpc.id}"
    
    tags {
        Name = "default_igw"
    }
}

resource "aws_elb" "default_elb" {
    name = "default_elb"
    
    # The same availability zone as our instance
    subnets = ["\${aws_subnet.defaut.id}"]
    
    security_groups = ["\${aws_security_group.dafeult_lb.id}"]
    
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
    
    instances                   = [i-13241241]
    cross_zone_load_balancing   = true
    idle_timeout                = 400
    connection_draining         = true
    connection_draining_timeout = 400
}
    
resource "aws_lb_cookie_stickiness_policy" "default" {
    name                     = "lbpolicy"
    load_balancer            = "\${aws_elb.default_elb.id}"
    lb_port                  = 80
    cookie_expiration_period = 600
}

resource "aws_vpc" "default_vpc" {
    cidr_block           = "10.0.0.0/16"
    enable_dns_hostnames = true

    tags {
    Name = "default_vpc"
    }
}

resource "aws_subnet" "default_sn" {
    vpc_id                  = "\${aws_vpc.default_vpc.id}"
    cidr_block              = "10.0.0.0/24"
    map_public_ip_on_launch = true

    tags {
        Name = "default_sn"
    }
}
`;
      let parser = new DOMParser();
      let xmlDoc = parser.parseFromString(payload,"text/xml");
      let xml_decoded = decode(xmlDoc.getElementsByTagName("diagram")[0].childNodes[0].nodeValue);
      let xml_dom = parser.parseFromString(xml_decoded, "text/xml");
      let innerText = jsonToTf(xmlToJson(xml_dom));
      expect(innerText).toEqual(expected);
    })
    it('convert XML containing invalid elements', ()=>{
        let payload = '<?xml version="1.0" encoding="UTF-8"?> <mxfile userAgent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.67 Safari/537.36" version="9.2.9" editor="www.draw.io"><diagram id="14058d99-db58-e9f5-3aba-399879c13e25" name="Page-1">1Vlbb+I4FP41PE6V2OTCY8swMyt1pUoj7T4ik5jgqRNHtkNgf/3asZ0LCb2oZRhQJZLj6/m+7xwf0xlc5ofvHJW7v1mK6Qx46WEGv84A8KEfqS9tORpL4C2MIeMktZ06w0/yH7ZGz1orkmIx6CgZo5KUQ2PCigIncmBDnLN62G3L6HDVEmV4ZPiZIDq2/ktSuTPWGISd/Qcm2c6t7IfWvw1KnjPOqsKuNwNw23xMc47cXNZRsUMpq3smuJrBJWdMmqf8sMRUY+tgM+O+nWlt981xId8yAPp2iJBH5zxOFRb2lXG5YxkrEF111ofGQayn8NTbTuZUPfrq8ReW8mjpRJVkytTN8MhYafuNt+m2wSqe2H1Az6pIIp5h6TZskdO77A217n3HLMeSH1UHjimSZD9kFFlhZG2/Dhz1YPFpXtnml5YW8CjaYGqGrZZ6ElIIiQq1zWbKAuV2jRpvBOZ7zK0v2brXJr6IzNj3ZWJsKd6iisq1NpgR1aZwjrpGUTipVw4rYH3JiXknX3wI5r76s3gdS7uqBHc5KYgxt5wbXIeC6PHPKklJgZdtbGmSUyR2LePKRUlUtDxqZJ6YIJKwQrVtmJQs73W4pyTTDVIz/4DsW6JYVyANlKMCodl0fsh0SrlDtYB3OFHbfNgSSpeMMt5sD34L4gDOlV11TImayrUVrMAvaUtvCh9e1IxthXN4F5hBNoHByMqu7tJBZOW562WCGL5bZ+rVSu2s7P7SeGllqMyIJK7R8VR6Ti0kq18TWSeDxY3IgFj31875a2giCMBAEX68cBrpacKdA31NROASmlhRJBS4yvjIUKq+FK4qKZFCZZmQqoEPG5WHwky27o/VgunmTOKRNskmYE1SMZ1mBvktRVusp3QztvqzosvqXucTIfrejQgRG8zXVCG+3rR4XydFzYdyjBbjBBU6hfbluPhwipqoIuCfW0X4YKKKcPXoxauICazmN4bV51dczdB7zvU51nYomcrzojfzkzb0EnAcDo9keFLanvb3vA/1B7ba73g1O+5Ybl1/I/HBjRHv6u8rEz+Pw5NqbG5vLeeonBoBPkLm1AH8z9Py3Lk6rrXM8jdwxDXn9nXKqzeU3GE0daLF70/Lr59oNtnsEa0GVUuPtS42NZyIJzYc/RF7QnL2jHuIes3nBGmL5hmQzRzu5wjwObCD+BR2PxjDDlxq7KMOY+/dsE/Fka09z4SSu/6+4T7jv3ytHRDyWhiUmOdECBVjYhwOXxf30dw/z9Rgpc8gKRqRBMHE5QNOsRRcIDbi12Pjz8loCWVVKjkidMxkFCyW2skLJjYfnJQV/sQvCZ9VqE9wtbglrlgpasafJ2LuNzAVDy/48/C3EuVkchtESV4JidM1SvdEaB6uwFc0Xd9fql7ofpQ39WL3nw+4+h8=</diagram></mxfile>';
        let expected = `
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

resource "aws_security_group" "ws-sg" {
    name        = "ws-sg"
    description = "Used in the terraform"
    vpc_id      = "\${aws_vpc.default_vpc.id}"
    
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

resource "aws_instance" "webserver" {
    instance_type = "t2.mini"
    
    # Lookup the correct AMI based on the region
    # we specified
    ami = "i-13241241"
    count = 2
    
    # The name of our SSH keypair you've created and downloaded
    # from the AWS console.
    #
    # https://console.aws.amazon.com/ec2/v2/home?region=eu-west-1#KeyPairs:
    #
    key_name = "\${var.key_name}"
    
    # Our Security group to allow HTTP and SSH access
    vpc_security_group_ids = ["\${aws_security_group.default_vpc.id}"]
    subnet_id              = "\${aws_subnet.default_sn.id}"
    
    #Instance tags
    
    tags {
        Name = "webserver"
    }
}

resource "aws_internet_gateway" "gw" {
    vpc_id = "\${aws_vpc.default_vpc.id}"
    
    tags {
        Name = "default_igw"
    }
}

resource "aws_elb" "default_elb" {
    name = "default_elb"
    
    # The same availability zone as our instance
    subnets = ["\${aws_subnet.defaut.id}"]
    
    security_groups = ["\${aws_security_group.dafeult_lb.id}"]
    
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
    
    instances                   = [i-13241241]
    cross_zone_load_balancing   = true
    idle_timeout                = 400
    connection_draining         = true
    connection_draining_timeout = 400
}
    
resource "aws_lb_cookie_stickiness_policy" "default" {
    name                     = "lbpolicy"
    load_balancer            = "\${aws_elb.default_elb.id}"
    lb_port                  = 80
    cookie_expiration_period = 600
}

resource "aws_vpc" "default_vpc" {
    cidr_block           = "10.0.0.0/16"
    enable_dns_hostnames = true

    tags {
    Name = "default_vpc"
    }
}

resource "aws_subnet" "default_sn" {
    vpc_id                  = "\${aws_vpc.default_vpc.id}"
    cidr_block              = "10.0.0.0/24"
    map_public_ip_on_launch = true

    tags {
        Name = "default_sn"
    }
}
`;
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(payload,"text/xml");
        let xml_decoded = decode(xmlDoc.getElementsByTagName("diagram")[0].childNodes[0].nodeValue);
        let xml_dom = parser.parseFromString(xml_decoded, "text/xml");
        let innerText = jsonToTf(xmlToJson(xml_dom));
        expect(innerText).toEqual(expected);
      })
      it('convert XML containing no valid element', ()=>{
        let payload = '<?xml version="1.0" encoding="UTF-8"?> <mxfile userAgent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.67 Safari/537.36" version="9.2.9" editor="www.draw.io"><diagram id="14058d99-db58-e9f5-3aba-399879c13e25" name="Page-1">1ZVNT8MwDIZ/Ta9T16xjPdLydQAJiQPnrPHaiCSu0ox2/HrcNd1aFSSQEIJdFr92Eud9rC1gmW5vLa/KBxSggigUbcCugihasuUFfXXKoVfiMOmFwkrhi87Ck3wDL4Ze3UsB9aTQISonq6mYozGQu4nGrcVmWrZDNb214gXMhKecq7n6LIUre3UTrc/6HciiHG5erv37tjx/KSzujb8viNju+OnTmg9n+YfWJRfYjCR2HbDMIrp+pdsMVOftYFu/7+aT7KlvC8Z9ZcOJ1CtXexh6PnbmDoMbuHdKGshOZocBSwWvSxA+eAXrJNl3z7egHrGWTqKh3BadQz0quFSy6BIOK1K5j3LqFiwJpdOK4iUtyZmqu1+3RTdjC97UbNGgfRGYE910J5XKUKE99kh71pfRhnSqFpLOG+Vu4s2KxaPclbT0kL5Fg7Zjks6d82Z2rUM7kryTt4AanD1Qic+ygaqf+oj5uBnP0CLuxXI0QMlqULmf3OJ0+pkeLTzAz2Bu/htMzaX6mzCjiynM1eq3YSb/CWZeSg1zkiFL4zT9gKRBAz8DKg6noFg8B5UkH2BKvg2JwvNP8zE3+v9j1+8=</diagram></mxfile>';
        let expected = `No valid element found.`;
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(payload,"text/xml");
        let xml_decoded = decode(xmlDoc.getElementsByTagName("diagram")[0].childNodes[0].nodeValue);
        let xml_dom = parser.parseFromString(xml_decoded, "text/xml");
        let innerText = jsonToTf(xmlToJson(xml_dom));
        expect(innerText).toEqual(expected);
      })
      it('convert invalid XML', ()=>{
        let payload = '<?xml version="1.0" encoding="UTF-8"?> <mxfile userAgent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.67 Safari/537.36" version="9.2.9" editor="www.draw.io"><diagram id="14058d99-db58-e9f5-3aba-399879c13e25" name="Page-1">1ZVNT8MwDIZ/Ta9T16xjPdLydQAJiQPnrPHaiCSu0ox2/HrcNd1aFSSQEIJdFr92Eud9rC1gmW5vLa/KBxSggigUbcCugihasuUFfXXKoVfiMOmFwkrhi87Ck3wDL4Ze3UsB9aTQISonq6mYozGQu4nGrcVmWrZDNb214gXMhKecq7n6LIUre3UTrc/6HciiHG5erv37tjx/KSzujb8viNju+OnTmg9n+YfWJRfYjCR2HbDMIrp+pdsMVOftYFu/7+aT7KlvC8Z9ZcOJ1CtXexh6PnbmDoMbuHdKGshOZocBSwWvSxA+eAXrJNl3z7egHrGWTqKh3BadQz0quFSy6BIOK1K5j3LqFiwJpdOK4iUtyZmqu1+3RTdjC97UbNGgfRGYE910J5XKUKE99kh71pfRhnSqFpLOG+Vu4s2KxaPclbT0kL5Fg7Zjks6d82Z2rUM7kryTt4AanD1Qic+ygaqf+oj5uBnP0CLuxXI0QMlqULmf3OJ0+pkeLTzAz2Bu/htMzaX6mzCjiynM1eq3YSb/CWZeSg1zkiFL4zT9gKRBAz8DKg6noFg8B5UkH2BKvg2JwvNP8zE3+v9j1+8=</diagram>';
        let expected = `No valid element found.`;
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(payload,"text/xml");
        let xml_decoded = decode(xmlDoc.getElementsByTagName("diagram")[0].childNodes[0].nodeValue);
        let xml_dom = parser.parseFromString(xml_decoded, "text/xml");
        let innerText = jsonToTf(xmlToJson(xml_dom));
        expect(innerText).toEqual(expected);
      })
  })