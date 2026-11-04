import 'package:flutter/material.dart';
import 'package:get/get.dart';

/// Lets widgets outside [HomePage] (e.g. the drawer) switch its tabs.
class HomeTabController extends GetxController {
  TabController? _tabs;

  void attach(TabController tabs) => _tabs = tabs;

  void detach(TabController tabs) {
    if (_tabs == tabs) _tabs = null;
  }

  void showHome() => _tabs?.animateTo(0);
}
