#import AutoCannon from "autocannon";
#
#AutoCannon(
#    {
#        url: "http://localhost:2000",
#        connections: 100,
#        pipelining: 10,
#        duration: 10
#    },
#    console.log
#);

npx autocannon -c 100 -p 10 -d 10 http://localhost:2000?foo=bar
