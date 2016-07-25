#r "canlibCLSNET.dll"
#r "kvadblibCLSNET.dll"

using System;
using System.Threading.Tasks;
using canlibCLSNET;
using Kvaser.Kvadblib;

public class Startup
{

    static string str;

    public async Task<object> Invoke(dynamic input) {

        str = input.val;
        Console.WriteLine("Received " + str);

        return new {
            init = (Func<object,Task<object>>)Init,
            help = (Func<object,Task<object>>)Help,
        };
    }

    private static async Task<object> Init(object i)
    {
        Console.WriteLine("init calling blocking code");
        Task.Run(() => Inner());
        Console.WriteLine("init returning");
        return 0;
    }

    private static async Task<object> Help(object i)
    {
        Console.WriteLine("help called " + str);
        return null;
    }

    private static void Inner() {
        while (true) {

        }
    }

}
