#r "canlibCLSNET.dll"

using System;
using System.Threading.Tasks;
using canlibCLSNET;

public class Startup
{
    public async Task<object> Invoke(object input)
    {
        int handle;
        Canlib.canStatus status;

        //Initialize, open channel and go on bus
        Canlib.canInitializeLibrary();

        handle = Canlib.canOpenChannel(0, Canlib.canOPEN_ACCEPT_VIRTUAL);
        CheckStatus((Canlib.canStatus)handle, "canSetBusParams");

        status = Canlib.canSetBusParams(handle, Canlib.canBITRATE_250K, 0, 0, 0, 0, 0);
        CheckStatus(status, "canSetBusParams");

        status = Canlib.canBusOn(handle);
        CheckStatus(status, "canBusOn");

        //Start dumping messages
        DumpMessageLoop(handle);

        //Go off bus and close channel
        status = Canlib.canBusOff(handle);
        CheckStatus(status, "canBusOff");

        status = Canlib.canClose(handle);
        CheckStatus(status, "canClose");

        return status;
    }

    private static void DumpMessageLoop(int handle)
    {
        Canlib.canStatus status;
        bool finished = false;

        //These variables hold the incoming message
        byte[] data = new byte[8];
        int id;
        int dlc;
        int flags;
        long time;

        Console.WriteLine("Channel opened. Press Escape to close. ");
        Console.WriteLine("ID  DLC DATA                      Timestamp");

        while (!finished)
        {
            //Wait for up to 100 ms for a message on the channel
            status = Canlib.canReadWait(handle, out id, data, out dlc, out flags, out time, 100);

            //If a message was received, display i
            if (status == Canlib.canStatus.canOK)
            {
                DumpMessage(id, data, dlc, flags, time);
            }

            //Call DisplayError and exit in case an actual error occurs
            else if (status != Canlib.canStatus.canERR_NOMSG)
            {
                CheckStatus(status, "canRead/canReadWait");
                finished = true;
            }
        }
    }


    //Prints an incoming message to the screen
    private static void DumpMessage(int id, byte[] data, int dlc, int flags, long time)
    {
        if ((flags & Canlib.canMSG_ERROR_FRAME) != 0)
        {
            Console.WriteLine("Error Frame received ****");
        }
        else
        {
            Console.WriteLine("{0}  {1}  {2:x2} {3:x2} {4:x2} {5:x2} {6:x2} {7:x2} {8:x2} {9:x2}    {10}",
                                             id, dlc, data[0], data[1], data[2], data[3], data[4],
                                             data[5], data[6], data[7], time);
        }
    }

    //This method prints an error if something goes wrong
    private static void CheckStatus(Canlib.canStatus status, string method)
    {
        if (status < 0)
        {
            Console.WriteLine(method + " failed: " + status.ToString());
        }
    }
}