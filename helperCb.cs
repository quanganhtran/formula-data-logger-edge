#r "canlibCLSNET.dll"
#r "kvadblibCLSNET.dll"

using System;
using System.Threading.Tasks;
using canlibCLSNET;
using Kvaser.Kvadblib;

public class Startup
{

    static Func<object, Task<object>> nodeHelper;

    static string filename = "messages.dbc";
    static int channel = 0;

    static int chanhandle;
    static Kvadblib.Hnd dbhandle;

    public async Task<object> Invoke(dynamic input)
    {
        nodeHelper = input.testHelper;

        Canlib.canStatus status;
        Kvadblib.Status dbstatus;

        //Initialize, open channel and go on bus
        Canlib.canInitializeLibrary();

        chanhandle = Canlib.canOpenChannel(channel, Canlib.canOPEN_ACCEPT_VIRTUAL);
        DisplayError((Canlib.canStatus)chanhandle, "canSetBusParams");

        status = Canlib.canSetBusParams(chanhandle, Canlib.canBITRATE_250K, 0, 0, 0, 0, 0);
        DisplayError(status, "canSetBusParams");

        status = Canlib.canBusOn(chanhandle);
        DisplayError(status, "canBusOn");


        //Load database
        dbhandle = new Kvadblib.Hnd();
        dbstatus = Kvadblib.Open(out dbhandle);
        DisplayDBError(dbstatus, "Opening database handle ");
        dbstatus = Kvadblib.ReadFile(dbhandle, filename);
        DisplayDBError(dbstatus, "Reading database from file ");

        if(dbstatus == Kvadblib.Status.OK && status == Canlib.canStatus.canOK)
        {
            await DumpMessageLoop();
        }

        //Go off bus and close channel
        status = Canlib.canBusOff(chanhandle);
        DisplayError(status, "canBusOff");

        status = Canlib.canClose(chanhandle);
        DisplayError(status, "canClose");

        //Wait for the user to press a key before exiting, in case the console closes automatically on exit.
        Console.WriteLine("Channel closed.");
        return 0;
    }

    private static async Task<object> DumpMessageLoop()
    {
        // Canlib.canStatus status;
        // bool finished = false;

        // //These variables hold the incoming message
        // byte[] data = new byte[8];
        // int id;
        // int dlc;
        // int flags;
        // long time;

        Console.WriteLine("Channel opened.");

        await nodeHelper(null);

        return 0;
    }

    //Displays error messages when a call to Canlib fails
    private static void DisplayError(Canlib.canStatus status, string method)
    {
        if (status < 0)
        {
            Console.WriteLine(method + " failed: " + status.ToString());
        }
    }

    //Displays messages for Kvadblib calls
    private static void DisplayDBError(Kvadblib.Status status, string method)
    {
        if (status < 0)
        {
            Console.WriteLine(method + " failed: " + status.ToString());
        }
    }
}
