using UnityEngine;

#if UNITY_WEBGL && !UNITY_EDITOR
using System.Runtime.InteropServices; // Required for DllImport
#endif

public class WebGLBridge : MonoBehaviour
{
#if UNITY_WEBGL && !UNITY_EDITOR


    // Declare the functions defined in Plugins/WebGLBridge.jslib
    [DllImport("__Internal")]
    private static extern void HideProgressBar();

    void Start()
    {
        // Call the JS functions
        HideProgressBar();
    }
#endif
}