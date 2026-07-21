--------------------
title: IEEE-754 floating-point converter
--------------------

# IEEE-754 floating-point converter

| Format        | Value                                                       |
|:--------------|:------------------------------------------------------------|
| Decimal       | <input id="val_dec" type="text" onchange="changed_dec()" /> |
| float64 (Hex) | <input id="val_hex" type="text" onchange="changed_hex()" /> |

<!-- All this crap can be a footer so as to not mess with the layout -->

<style>
    td input {
        width: 100%;
    }
</style>

<script class="foo">
    const RE_HEX = new RegExp("[^0-9a-f]");
    const RE_DEC = new RegExp("[^0-9]");

    var buffer = new ArrayBuffer(8);
    var view = new DataView(buffer);

    function show_result() {
        document.querySelector("#val_hex").value = "0x" + view.getBigUint64(0, true).toString(16).padStart(16, "0");
        document.querySelector("#val_dec").value = view.getFloat64(0, true).toString();
    }

    function changed_hex() {
        var as_str = document.querySelector("#val_hex").value.toLowerCase();
        if (as_str.startsWith("0x"))
            as_str = as_str.slice(2);
        const as_number = BigInt(parseInt(as_str, 16));
        // console.debug("Hexadecimal value changed!", as_str, as_number);
        view.setBigUint64(0, as_number, true);
        show_result();
    }

    function changed_dec() {
        const as_str = document.querySelector("#val_dec").value.toLowerCase();
        const as_number = parseFloat(as_str);
        // console.debug("Decimal value changed!");
        view.setFloat64(0, as_number, true);
        show_result();
    }

    show_result();
</script>
