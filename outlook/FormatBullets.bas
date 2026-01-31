Attribute VB_Name = "FormatBullets"
' FormatBullets.bas - Outlook VBA macro
' After pasting content from the RTF Copy Obsidian plugin,
' run this macro to apply proper indentation based on bullet characters.
'
' Bullet mapping (matches plugin defaults):
'   U+2022 (bullet)  = Level 1 -> no indent
'   U+2013 (en-dash) = Level 2 -> 0.25" indent
'   U+25E6 (circle)  = Level 3 -> 0.5" indent
'
' To install:
'   1. In Outlook, press Alt+F11 to open the VBA editor
'   2. Insert > Module, paste this code
'   3. Optionally assign a keyboard shortcut via
'      File > Options > Customize Ribbon > Keyboard Shortcuts

Private Const INDENT_PER_LEVEL As Single = 18 ' 0.25 inches = 18pt

Public Sub FormatPastedBullets()
    Dim insp As Outlook.Inspector
    Set insp = Application.ActiveInspector

    If insp Is Nothing Then
        MsgBox "No active message window.", vbExclamation
        Exit Sub
    End If

    If Not TypeOf insp.CurrentItem Is Outlook.MailItem Then
        MsgBox "Active item is not an email.", vbExclamation
        Exit Sub
    End If

    Dim doc As Object ' Word.Document
    Set doc = insp.WordEditor

    If doc Is Nothing Then
        MsgBox "Cannot access the message body.", vbExclamation
        Exit Sub
    End If

    Dim bulletL1 As String
    Dim bulletL2 As String
    Dim bulletL3 As String
    bulletL1 = ChrW(&H2022) ' bullet
    bulletL2 = ChrW(&H2013) ' en-dash
    bulletL3 = ChrW(&H25E6) ' open circle

    Dim para As Object ' Word.Paragraph
    Dim trimmed As String
    Dim firstChar As String
    Dim level As Long

    For Each para In doc.Paragraphs
        trimmed = para.Range.Text

        ' Strip leading non-breaking spaces and regular spaces
        Do While Len(trimmed) > 0
            If Left$(trimmed, 1) = " " Or Left$(trimmed, 1) = ChrW(&HA0) Then
                trimmed = Mid$(trimmed, 2)
            Else
                Exit Do
            End If
        Loop

        If Len(trimmed) = 0 Then GoTo NextPara

        firstChar = Left$(trimmed, 1)
        level = 0
        If firstChar = bulletL1 Then level = 1
        If firstChar = bulletL2 Then level = 2
        If firstChar = bulletL3 Then level = 3

        If level > 0 Then
            para.Format.LeftIndent = (level - 1) * INDENT_PER_LEVEL

            ' Clean leading nbsp padding that the plugin inserted before the bullet
            Dim rng As Object
            Set rng = para.Range
            ' Move start past any whitespace before the bullet character
            Dim c As String
            Do While rng.Start < rng.End
                c = rng.Characters(1).Text
                If c = " " Or c = ChrW(&HA0) Then
                    rng.Characters(1).Delete
                Else
                    Exit Do
                End If
            Loop
        End If

NextPara:
    Next para
End Sub
