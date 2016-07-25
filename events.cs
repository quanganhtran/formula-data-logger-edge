#r "canlibCLSNET.dll"

using System;
using System.Threading.Tasks;
using canlibCLSNET;

public class Startup
{
    public async Task<object> Invoke(dynamic input)
    {
        // Create a timer with the specifed interval.
        // Conceptually this can be any event source.
        var timer = new System.Timers.Timer(input.interval);
        // Hook up the Elapsed event for the timer and delegate
        // the call to a Node.js event handler.
        // Depending on the EventArgs, the data may need to be transformed
        // if it cannot be directly marshaled by Edge.js.
        timer.Elapsed += (Object source, System.Timers.ElapsedEventArgs e) => {
            ((Func<object,Task<object>>)input.event_handler)(e).Start();
        };
        // Start the timer

        timer.Enabled = true;
        // Return a function that can be used by Node.js to
        // unsubscribe from the event source.
        return (Func<object,Task<object>>)(async (dynamic data) => {
            timer.Enabled = false;
            return null;
        });
    }

}